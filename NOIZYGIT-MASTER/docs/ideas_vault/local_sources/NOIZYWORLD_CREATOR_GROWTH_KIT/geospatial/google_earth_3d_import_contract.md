# Google Earth 3D Import Contract For NOIZYWORLD

Created: 2026-09-04

Purpose: turn the current Google Earth 3D model import documentation into a
NOIZYWORLD-ready constraint contract.

Status: Google Earth 3D model import is experimental / pre-GA. Treat it as a
presentation adapter, not a source of truth, asset vault, rights ledger, or
permanent export format.

## Official Facts Checked

- Google Earth lists 3D model import among Experimental features and says
  Experimental features are subject to pre-GA terms. The experimental overview
  page was last updated 2026-09-01 UTC.
- Google Earth release notes introduced 3D model import for GLB files as an
  Experimental feature on 2026-04-16.
- The import documentation states that GLB is the only supported 3D model import
  format. GLTF, COLLADA, and OBJ are not supported.
- Non-GLB assets should be exported to GLB through tools such as Blender, 3DS
  Max, Rhino 3D, or Tinkercad.
- Referenced textures and GLB-based animations are not supported at this time.
- Imported models count toward Google Earth storage quota, and each upload is a
  separate quota item.
- Copying imported models is not supported inside the same project or across
  projects.
- If an account enters over-quota status, new imports are blocked until the plan
  is upgraded or imported content/projects are deleted.
- Metallic materials and unsupported glTF extensions can render incorrectly.
- If an imported model is invisible, the source scale may be too small; Google
  suggests testing visibility by adjusting scale to 1000 percent.
- 3D models are not supported in KML/KMZ export.

## NOIZYWORLD Design Consequence

Google Earth should be treated as an immersive geospatial showcase adapter. The
authoritative NOIZYWORLD asset stays in the local or vault-backed asset graph
with creator ownership, consent, provenance, license, split-sheet, and evidence
records.

For each Google Earth import, NOIZYWORLD should create an Earth-ready GLB
derivative and a manifest that records:

- Source asset hash.
- Earth-ready GLB hash.
- Creator owner.
- License and consent IDs.
- Export toolchain.
- Render checks.
- Known unsupported features removed.
- Import channel.
- Google Earth project reference as an opaque identifier.

Do not use Google Earth storage as the canonical place to prove ownership,
consent, licensing, royalty splits, or provenance.

## Import Pipeline

1. Validate the original asset in the NOIZYWORLD asset graph.
2. Confirm the creator has granted distribution/showcase consent for a Google
   Earth derivative.
3. Convert or export to `.glb`.
4. Remove GLB animations and referenced-texture dependencies.
5. Avoid or review metallic materials and unsupported glTF material extensions.
6. Normalize scale and orientation before upload.
7. Generate an import manifest and hash both source and derivative.
8. Upload by Google Drive or device only after the manifest exists.
9. Record the upload as an Evidence Spine event.
10. Keep a screenshot or render note as inspection evidence when possible.

## Forbidden Assumptions

- Do not promise that GLTF, OBJ, COLLADA, animations, or referenced textures will
  work in Google Earth.
- Do not promise KML/KMZ export for imported 3D models.
- Do not rely on Google Earth project storage as durable custody.
- Do not rely on same-project or cross-project model copying.
- Do not log private project links, auth-bearing URLs, raw GPS, or creator
  private asset URLs in context packets.

## Source References

- Google Earth import 3D models: https://developers.google.com/maps/documentation/earth/import-3d-models
- Google Earth experimental overview: https://developers.google.com/maps/documentation/earth/experimental-overview
- Google Earth release notes: https://developers.google.com/maps/documentation/earth/release-notes
- Khronos glTF 2.0 specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html

