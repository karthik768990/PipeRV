# Simple program to test forwarding and hazards

ADDI x1, x0, 5      # x1 = 5
ADDI x2, x0, 10     # x2 = 10

ADD x3, x1, x2      # x3 = 15
SUB x4, x3, x1      # x4 = 10 (tests forwarding)

SW x3, 0(x0)        # store 15 to memory[0]
LW x5, 0(x0)        # load back

ADD x6, x5, x1      # load-use hazard test

NOP
NOP