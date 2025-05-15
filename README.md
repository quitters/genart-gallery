# Generative Art Gallery

A curated collection of 16 interactive generative art pieces created with p5.js, focusing on algorithmic aesthetics, creative coding, and mathematical visualizations.

## Overview

This gallery showcases various approaches to generative art, from particle systems and flow fields to complex mathematical patterns and interactive string art. Each piece demonstrates different concepts in creative coding while maintaining high performance and interactive elements.

## Artworks

### 1. Fluid Dynamics
An optimized flow field visualization with interactive particle systems. Features UI controls for particle color, trail length, and field adjustments. Implemented with performance optimization for smooth animations even with hundreds of particles.

### 2. Crystalline Growth
Simulates crystal formation through recursive growth patterns, creating elegant geometric structures that evolve over time.

### 3. Harmonic Waves
Visualizes sound-like wave patterns with frequency and amplitude modulation, creating hypnotic undulating forms.

### 4. Botanical Dreams
Generative plant-like structures and growth patterns inspired by L-systems and natural botanical forms.

### 5. Digital Rain
A matrix-inspired visualization of cascading digital particles, creating a cyberpunk aesthetic.

### 6. Fractal Clouds
Cloud-like formations generated through fractal noise algorithms with dynamic lighting effects.

### 7. Circuit Poetry
Abstract visualization of electronic circuit patterns that form poetry-like structures and flows.

### 8. Chromatic Symphony
Color theory exploration with harmonious palette generation and interactive color progressions.

### 9. Sacred Geometry
Explores mathematical patterns found in various cultural and spiritual traditions through precise geometric constructions.

### 10. Cosmic Nebula
Simulation of cosmic gas clouds and star formations using particle systems and force fields.

### 11. Urban Sketches
Procedurally generated cityscapes and architectural forms with a hand-drawn aesthetic.

### 12. Emergent Patterns
Implementation of cellular automata and agent-based systems that demonstrate emergent complexity from simple rules.

### 13. Quantum Entanglement
Abstract visualization of quantum physics concepts through interconnected particle systems.

### 14. Geometric Tessellations
Exploration of space-filling geometric patterns inspired by mathematical tessellations and Islamic art.

### 15. StringArt Portraits
An advanced string art face generator that creates portraits using mathematical string patterns. Features both circular and rectangular peg layouts with various controls:
- Toggleable layouts for head, mouth, and hair elements
- Adjustable animation speed and pattern detail
- Color cycling and randomization
- Interactive keys for modifying individual facial features

### 16. Prismatic Crystals
High-performance visualization of multi-colored crystal formations with temporal animations. Optimized for WebGL with flat arrays and batch rendering for maximum efficiency.

## How to Run

1. Clone or download this repository
2. Open the `generative-art/index.html` file in a modern web browser
3. Click on any artwork tile to view and interact with the piece
4. Use the back button to return to the gallery

## Technical Features

- Built with p5.js for 2D graphics rendering
- WebGL acceleration for complex visualizations
- Responsive design that works across desktop and mobile devices
- Performance optimizations for smooth animations
- Interactive controls unique to each artwork

## Keyboard Controls

Many artworks support keyboard shortcuts for adjusting parameters and interactions:

- **StringArt Portraits (artwork15):**
  - L: Toggle head shape between circle and rectangle
  - M: Change mouth style and layout
  - H: Change hair style and layout
  - E: Modify eyes
  - C: Change color palette
  - D: Adjust pattern detail/complexity
  - S: Cycle animation speed
  - Space: Generate new face
  
- **Prismatic Crystals (artwork16):**
  - Click to regenerate crystal formations

## Implementation Notes

- The StringArt Portraits piece uses mathematical principles of string art to create facial features through the intersection of straight lines.
- Prismatic Crystals employs flat arrays and batch rendering for WebGL optimization, avoiding deep recursion and object allocation.
- Several artworks implement efficient particle systems with spatial partitioning for collision detection.

## Future Enhancements

- Audio reactivity for selected pieces
- Export functionality to save high-resolution outputs
- Additional interaction methods
- VR/AR compatibility exploration

