# Bubble Sort for 5 positive numbers
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

# Load array[j] into x18
lw x18, 0(x17)

# Load array[j+1] into x20
addi x19, x17, 4
lw x20, 0(x19)

# ==========================================
# SOFTWARE "GREATER THAN" CHECK
# We want to swap if x18 > x20
# ==========================================
# Make temporary copies to decrement
addi x22, x18, 0       # temp_left = array[j]
addi x23, x20, 0       # temp_right = array[j+1]

find_max_loop:
# Check if the right number (x23) hit 0 first
bne x23, x0, check_left_zero
bne x22, x0, do_swap   # Right is 0, Left is > 0. Left is bigger! SWAP!
jal x0, skip_swap      # Both are 0. They are equal. Do not swap.

check_left_zero:
# Check if the left number (x22) hit 0 first
bne x22, x0, decrement_both
jal x0, skip_swap      # Left is 0, Right is > 0. Right is bigger. Do not swap.

decrement_both:
addi x22, x22, -1
addi x23, x23, -1
jal x0, find_max_loop
# ==========================================

# --- Swap Elements ---
do_swap:
sw x20, 0(x17)
sw x18, 0(x19)

# --- Next Inner Iteration ---
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