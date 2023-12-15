.mode box
.read dupes.sql
.read regs-summary.sql

.mode csv
.output ../work/regs.csv
.read regs-summary.sql
.output

.mode json
.output ../work/regs.json
.read regs-summary.sql
.output
