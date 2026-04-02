# --- Test 3: Cache Set Thrasher ---

# Setup values
addi x1, x0, 1
addi x2, x0, 2
addi x3, x0, 3

# Force loads to the same set (Assuming 64-byte blocks)
# Miss (loads Block 0)
sw x1, 0(x0)

# Miss (loads Block 1)
sw x2, 64(x0)

# Miss (loads Block 2) - May evict Block 0 to L2!
sw x3, 128(x0)

# Re-fetch from Block 0 (Potential miss again if evicted)
lw x4, 0(x0)

# x5 = 1 + 1 = 2
add x5, x4, x1

# Store next to addr 0. Should be a hit if Block 0 was re-fetched.
sw x5, 4(x0)

end:
nop
nop
nop