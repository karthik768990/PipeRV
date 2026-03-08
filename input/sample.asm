addi x1, x0, 5
addi x2, x0, 5

loop:
sub x3, x1, x2
bne x3, x0, end

addi x2, x2, -1
jal x0, loop

end:
sw x2, 0(x0)