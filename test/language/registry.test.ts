import { describe, expect, it } from 'vitest';
import { languages, loadLanguage, resolveLanguage } from '../../src/language/registry';
describe('registry', () => {
  it('resolves names, extensions, filenames and fence information', () => {
    const cases: [Parameters<typeof resolveLanguage>[0], string | undefined][] = [
      [{name:'TS'},'typescript'],[{name:'zsh'},'bash'],[{name:'nant'},'xml'],[{name:'lhs'},'haskell'],[{name:'camlp4'},'ocaml'],[{name:'ocamllex'},'ocaml'],[{name:'ocamlyacc'},'ocaml'],[{name:'multimarkdown'},'markdown'],[{name:'rails'},'ruby'],[{name:'sql-erb'},'sql'],[{name:'shell-unix-generic'},'bash'],[{name:'js-erb'},'javascript'],[{extension:'.RS'},'rust'],[{extension:'rs'},'rust'],[{filename:'Dockerfile'},'dockerfile'],[{filename:'src/x.html.erb'},'erb'],[{filename:'a.js.erb'},'javascript'],[{filename:'q.sql.erb'},'sql'],[{filename:'x.d.ts'},'typescript'],[{filename:'Makefile'},'makefile'],[{filename:'CMakeLists.txt'},'makefile'],[{extension:'asp'},'asp'],[{name:'php'},'php'],[{name:'java'},'java'],[{name:'javascript'},'javascript'],[{name:'bash'},'bash'],[{filename:'p.build'},'xml'],[{fenceInfo:'ts'},'typescript'],[{fenceInfo:' rust ignore'},'rust'],[{fenceInfo:'{.python}'},'python'],[{fenceInfo:'js,linenos'},'javascript'],[{fenceInfo:'yml'},'yaml'],[{fenceInfo:'nope'},undefined],[{},undefined],[{extension:'m'},'objc'],[{filename:'C:\\src\\X.D.TS'},'typescript'],[{fenceInfo:'ts',name:'rust'},'typescript'],
    ];
    for (const [query, id] of cases) expect(resolveLanguage(query)?.id, JSON.stringify(query)).toBe(id);
    expect(languages).toHaveLength(71);
  });
  it('caches promises and does not cache failures', async () => {
    const a = loadLanguage('rust'); expect(loadLanguage('rust')).toBe(a); expect((await a).name).toBe('rust');
    const x = loadLanguage('nope'), y = loadLanguage('nope'); expect(x).not.toBe(y); await expect(x).rejects.toThrow('unknown language'); await expect(y).rejects.toThrow('unknown language');
    expect(loadLanguage('markdown', {embedded:['ts','python','ts']})).toBe(loadLanguage('markdown', {embedded:['python','typescript']}));
  });
});
