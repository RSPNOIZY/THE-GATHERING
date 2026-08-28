# intelligence-matrices/

Dashboards, plots, and signal synthesis. The "show-on-plots" intelligence
layer referenced in the consolidation call.

## Pattern
- Interactive HTML artifacts (see `../react-components/` for shared bits)
- Data pulled live from the Lucy API (`/api/mesh`, `/api/history`)
- Read-only — these visualize, they do not command

## First views to build
- [ ] Mesh heartbeat timeline (who was live when)
- [ ] Session activity by surface (iPad vs iPhone vs M2)
- [ ] Pops interventions over time

*(Architect: confirm "show-on-plots intelligence matrices" maps to
"dashboards"? Noting speech-to-text uncertainty on the original phrase.)*
