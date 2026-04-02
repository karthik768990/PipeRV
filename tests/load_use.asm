# --- Test 1: Load-Use Hazard ---
# mem[0] = 10 (L1D Miss, 5+ cycles)
addi x1, x0, 10
sw x1, 0(x0)

# x2 = 10 (L1D Hit)
lw x2, 0(x0)

# RAW HAZARD: x3 = 10 + 10 = 20. MUST stall for lw!
add x3, x2, x1

# mem[4] = 20
sw x3, 4(x0)

# Independent instruction
addi x4, x0, 99

# mem[8] = 99
sw x4, 8(x0)

end:
nop
nop
nop