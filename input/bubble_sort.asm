# Bubble Sort for 5 numbers
# array base address = 0

# --- Initialize Array ---
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

# --- Bubble Sort Setup ---
# n = 5
addi x10, x0, 5

# i = 0
addi x11, x0, 0

# --- Outer Loop ---
outer_loop:
addi x12, x10, -1
sub x13, x11, x12
bne x13, x0, inner_init
jal x0, end

# --- Inner Loop Setup ---
inner_init:
# j = 0
addi x14, x0, 0

# --- Inner Loop ---
inner_loop:
sub x15, x10, x11
addi x15, x15, -1
sub x16, x14, x15
bne x16, x0, compare
jal x0, outer_inc

# --- Compare ---
compare:
# Calculate byte offset for array[j]
add x17, x14, x14
add x17, x17, x17

lw x18, 0(x17)           # x18 = array[j]

addi x19, x17, 4
lw x20, 0(x19)           # x20 = array[j+1]

# If array[j+1] < array[j], SWAP!
blt x20, x18, do_swap
jal x0, skip_swap

# --- Swap Elements ---
do_swap:
sw x20, 0(x17)
sw x18, 0(x19)

skip_swap:
addi x14, x14, 1
jal x0, inner_loop

# --- Next Outer Iteration ---
outer_inc:
addi x11, x11, 1
jal x0, outer_loop

# --- End Program ---
end:
nop
nop
nop