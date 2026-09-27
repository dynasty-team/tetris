# demo.tape — gameplay showcase
Output 04-Demo/assets/gameplay.gif

Set FontSize 20
Set Width 900
Set Height 600
Set Theme "Dracula"
Set TypingSpeed 100ms

Type "bun run start"
Enter
Sleep 2s

# Move left/right ให้เห็น collision
Left
Left
Sleep 300ms
Right
Right
Right
Sleep 500ms

# หมุน
Up
Sleep 500ms
Up
Sleep 500ms

# Soft drop
Down
Down
Sleep 500ms

# Hard drop
Space
Sleep 1s

# เล่นต่อสัก 2-3 ตาเพื่อให้มีโอกาสเคลียร์แถว
Space
Sleep 1s
Space
Sleep 1s
Space
Sleep 1.5s

Sleep 2s