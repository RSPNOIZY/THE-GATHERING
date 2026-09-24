/*
 * ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                                            ║
 * ║     ⚡ A E O N   P M I C   E N C L O S U R E ⚡                                                            ║
 * ║                                                                                                            ║
 * ║     OpenSCAD design for 3D printing (TPU recommended for flexibility)                                     ║
 * ║                                                                                                            ║
 * ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// PARAMETERS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

// PCB dimensions
pcb_width = 40;
pcb_length = 25;
pcb_thickness = 1.6;

// Battery dimensions (under PCB)
battery_width = 35;
battery_length = 50;
battery_thickness = 8;

// Supercapacitor
supercap_diameter = 10;
supercap_height = 20;

// Wall thickness
wall = 1.5;

// Tolerances
tol = 0.3;

// Total enclosure size
enc_width = max(pcb_width, battery_width) + 2*wall + 2*tol;
enc_length = max(pcb_length, battery_length) + 2*wall + 2*tol;
enc_height = pcb_thickness + battery_thickness + 2*wall + 2*tol;

// Corner radius
corner_r = 3;

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// MODULES
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

module rounded_box(w, l, h, r) {
    hull() {
        for (x = [r, w-r]) {
            for (y = [r, l-r]) {
                translate([x, y, 0]) cylinder(h=h, r=r, $fn=32);
            }
        }
    }
}

module enclosure_base() {
    difference() {
        // Outer shell
        rounded_box(enc_width, enc_length, enc_height, corner_r);
        
        // Inner cavity
        translate([wall, wall, wall])
            rounded_box(enc_width - 2*wall, enc_length - 2*wall, enc_height, corner_r - wall/2);
        
        // USB-C port cutout
        translate([enc_width/2 - 5, -1, enc_height - 5])
            cube([10, wall + 2, 4]);
        
        // LED window
        translate([enc_width/2 - 3, enc_length - wall - 1, enc_height - 8])
            cube([6, wall + 2, 6]);
        
        // Button hole
        translate([5, enc_length/2, enc_height - wall - 1])
            cylinder(h=wall + 2, d=6, $fn=32);
        
        // Ventilation slots
        for (i = [0:3]) {
            translate([enc_width - wall - 1, 10 + i*8, enc_height/2])
                cube([wall + 2, 5, 3]);
        }
    }
}

module enclosure_lid() {
    lid_height = 3;
    lip = 2;
    
    difference() {
        union() {
            // Main lid
            rounded_box(enc_width, enc_length, lid_height, corner_r);
            
            // Inner lip
            translate([wall + tol, wall + tol, -lip])
                rounded_box(enc_width - 2*wall - 2*tol, enc_length - 2*wall - 2*tol, lip, corner_r - wall);
        }
        
        // Solar panel window (large opening)
        translate([5, 5, -1])
            rounded_box(enc_width - 10, enc_length - 10, lid_height + 2, 2);
    }
}

module supercap_holder() {
    difference() {
        cylinder(h=supercap_height + 2, d=supercap_diameter + 4, $fn=32);
        translate([0, 0, 1])
            cylinder(h=supercap_height + 2, d=supercap_diameter + tol*2, $fn=32);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// ASSEMBLY
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

// Uncomment to render individual parts:

// Base
enclosure_base();

// Lid (offset for printing)
translate([enc_width + 10, 0, 0])
    enclosure_lid();

// Supercap holder (optional, mounts inside)
translate([enc_width + 10, enc_length + 10, 0])
    supercap_holder();

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// PRINT SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

/*
Recommended settings:
- Material: TPU 95A (flexible) or PETG (rigid)
- Layer height: 0.2mm
- Infill: 20%
- Supports: Yes for base (USB cutout)
- Brim: Yes for TPU

Total dimensions:
- Width: 44mm
- Length: 54mm  
- Height: 14mm

Weight estimate: ~15g (TPU)
*/
