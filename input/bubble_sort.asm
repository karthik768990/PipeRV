# Bubble Sort for 5 numbers
# array base address = 0

# memory layout
# 0   -> 5
# 4   -> 1
# 8   -> 4
# 12  -> 2
# 16  -> 8

# initialize array
addi x1, x0, 5
sw x1, 0(x0)

addi x1, x0, 1
sw x1, 4(x0)

addi x1, x0, 4
sw x1, 8(x0)

addi x1, x0, 2
sw x1, 12(x0)

addi x1, x0, 8
sw x1, 16(x0)

# n = 5
addi x10, x0, 5

# i = 0
addi x11, x0, 0

outer_loop:

# if i == n-1 -> end
addi x12, x10, -1
sub x13, x11, x12
bne x13, x0, inner_init
jal x0, end

inner_init:
addi x14, x0, 0   # j = 0

inner_loop:

# if j == n-i-1 -> next outer
sub x15, x10, x11
addi x15, x15, -1
sub x16, x14, x15
bne x16, x0, compare
jal x0, outer_inc

compare:

# addr = j*4
add x17, x14, x14
add x17, x17, x17

# load A[j]
lw x18, 0(x17)

# load A[j+1]
addi x19, x17, 4
lw x20, 0(x19)

# if A[j] <= A[j+1] skip swap
sub x21, x18, x20
bne x21, x0, do_swap
jal x0, skip_swap

do_swap:

sw x20, 0(x17)
sw x18, 0(x19)

skip_swap:

addi x14, x14, 1
jal x0, inner_loop

outer_inc:

addi x11, x11, 1
jal x0, outer_loop

end:

nop
nop
nop