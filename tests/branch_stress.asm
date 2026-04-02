# --- Test 2: Branch Flush Test ---

# Loop limit: x1 = 5
addi x1, x0, 5

# Counter: x2 = 0
addi x2, x0, 0

# Accumulator: x3 = 0
addi x3, x0, 0

# --- Loop Start ---
loop_start:
addi x2, x2, 1
add x3, x3, x2

# If counter >= limit, exit loop
bge x2, x1, loop_end

# Else, continue loop
jal x0, loop_start

# --- Loop End ---
loop_end:
# Store final counter (should be 5)
sw x2, 0(x0)

# Store final sum (should be 15)
sw x3, 4(x0)

end:
nop
nop
nop