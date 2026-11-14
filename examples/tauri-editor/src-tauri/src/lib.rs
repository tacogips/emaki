use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

fn cli_path(args: impl Iterator<Item = String>) -> Option<PathBuf> {
    args.skip(1)
        .find(|arg| !arg.starts_with('-'))
        .and_then(|path| std::path::absolute(path).ok())
}
fn absolutize(path: &Path) -> Result<PathBuf, String> {
    std::path::absolute(path).map_err(|err| format!("invalid path: {}: {err}", path.display()))
}
fn is_granted(set: &HashSet<PathBuf>, path: &Path) -> bool {
    set.contains(path)
}
fn read_text(path: &Path) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|err| {
        if err.kind() == std::io::ErrorKind::NotFound {
            format!("file not found: {}", path.display())
        } else {
            format!("read failed: {}: {err}", path.display())
        }
    })?;
    String::from_utf8(bytes).map_err(|_| format!("not valid UTF-8: {}", path.display()))
}
fn write_text(path: &Path, contents: &str) -> Result<(), String> {
    fs::write(path, contents).map_err(|err| format!("write failed: {}: {err}", path.display()))
}
struct AppState {
    granted: Mutex<HashSet<PathBuf>>,
    initial: Option<PathBuf>,
}

#[tauri::command]
async fn read_text_file(path: String, state: tauri::State<'_, AppState>) -> Result<String, String> {
    let path = PathBuf::from(path);
    if !is_granted(
        &*state.granted.lock().map_err(|err| err.to_string())?,
        &path,
    ) {
        return Err(format!("path not permitted: {}", path.display()));
    }
    read_text(&path)
}
#[tauri::command]
async fn write_text_file(
    path: String,
    contents: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let path = PathBuf::from(path);
    if !is_granted(
        &*state.granted.lock().map_err(|err| err.to_string())?,
        &path,
    ) {
        return Err(format!("path not permitted: {}", path.display()));
    }
    write_text(&path, &contents)
}
fn grant(
    path: Option<tauri_plugin_dialog::FilePath>,
    state: &AppState,
) -> Result<Option<String>, String> {
    path.map(|path| {
        let path = path.into_path().map_err(|err| err.to_string())?;
        state
            .granted
            .lock()
            .map_err(|err| err.to_string())?
            .insert(path.clone());
        Ok(path.to_string_lossy().into_owned())
    })
    .transpose()
}
#[tauri::command]
async fn pick_open_path(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<Option<String>, String> {
    grant(app.dialog().file().blocking_pick_file(), &state)
}
#[tauri::command]
async fn pick_save_path(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    suggested: Option<String>,
) -> Result<Option<String>, String> {
    let mut dialog = app.dialog().file();
    if let Some(name) = suggested {
        dialog = dialog.set_file_name(name);
    }
    grant(dialog.blocking_save_file(), &state)
}
#[tauri::command]
async fn confirm_open_path(
    path: String,
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<Option<String>, String> {
    let abs = absolutize(Path::new(&path))?;
    if !app
        .dialog()
        .message(format!("Open {}?", abs.display()))
        .kind(MessageDialogKind::Info)
        .buttons(MessageDialogButtons::OkCancel)
        .blocking_show()
    {
        return Ok(None);
    }
    state
        .granted
        .lock()
        .map_err(|err| err.to_string())?
        .insert(abs.clone());
    Ok(Some(abs.to_string_lossy().into_owned()))
}
#[tauri::command]
async fn confirm_discard(app: tauri::AppHandle) -> Result<bool, String> {
    Ok(app
        .dialog()
        .message("Discard unsaved changes?")
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::OkCancel)
        .blocking_show())
}
#[tauri::command]
async fn initial_path(state: tauri::State<'_, AppState>) -> Result<Option<String>, String> {
    Ok(state
        .initial
        .as_ref()
        .map(|path| path.to_string_lossy().into_owned()))
}
pub fn run() {
    let initial = cli_path(std::env::args());
    let granted = initial.iter().cloned().collect();
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            granted: Mutex::new(granted),
            initial,
        })
        .invoke_handler(tauri::generate_handler![
            initial_path,
            pick_open_path,
            pick_save_path,
            confirm_open_path,
            confirm_discard,
            read_text_file,
            write_text_file
        ])
        .run(tauri::generate_context!())
        .expect("error running emaki editor");
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn absolutize_relative() {
        assert_eq!(
            absolutize(Path::new("rel/x.txt")).unwrap(),
            std::env::current_dir().unwrap().join("rel/x.txt")
        );
    }
    #[test]
    fn absolutize_absolute() {
        let p = std::env::temp_dir().join("a.txt");
        assert_eq!(absolutize(&p).unwrap(), p);
    }
    fn path(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("emaki-tauri-editor-{}-{name}", std::process::id()))
    }
    #[test]
    fn round_trip() {
        let p = path("round-trip");
        write_text(&p, "hello\nworld\n").unwrap();
        assert_eq!(read_text(&p).unwrap(), "hello\nworld\n");
        fs::remove_file(p).unwrap();
    }
    #[test]
    fn missing_file() {
        let p = path("missing");
        let _ = fs::remove_file(&p);
        assert!(read_text(&p).unwrap_err().starts_with("file not found: "));
    }
    #[test]
    fn utf8_round_trip() {
        let p = path("utf8");
        let text = "日本語 ✓ 🎉\n";
        write_text(&p, text).unwrap();
        assert_eq!(read_text(&p).unwrap(), text);
        assert_eq!(fs::read(&p).unwrap(), text.as_bytes());
        fs::remove_file(p).unwrap();
    }
    #[test]
    fn invalid_utf8() {
        let p = path("invalid");
        fs::write(&p, [0xff, 0xfe, 0x41]).unwrap();
        assert!(read_text(&p).unwrap_err().starts_with("not valid UTF-8: "));
        fs::remove_file(p).unwrap();
    }
    #[test]
    fn grants() {
        let a = path("a");
        let b = path("b");
        let set = HashSet::from([a.clone()]);
        assert!(is_granted(&set, &a));
        assert!(!is_granted(&set, &b));
    }
    #[test]
    fn cli_arguments() {
        let args = ["bin", "--flag", "x.txt"].into_iter().map(String::from);
        let p = cli_path(args).unwrap();
        assert!(p.is_absolute());
        assert!(p.ends_with("x.txt"));
        assert_eq!(cli_path([String::from("bin")].into_iter()), None);
    }
}
