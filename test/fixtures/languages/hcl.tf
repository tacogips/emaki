# note
resource "a" "b" {
  count = 42
  name = "hello ${var.x}"
  content = <<EOF
heredoc body
EOF
}
// comment
/* block */
# sample line 0
# sample line 1
# sample line 2
# sample line 3
# sample line 4
# sample line 5
# sample line 6
# sample line 7
# sample line 8
# sample line 9
