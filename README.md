# PickRandomSpot 🌍🎲

![An example screenshot](docs/showcase.png?raw=true "An example screenshot")

## Overview

PickRandomSpot is an interactive web application that allows you to generate a random geographical point within a selected area on a world map. Perfect for adventurers, photographers, travelers, and anyone looking to explore new locations in a spontaneous way!

## Key Features

- 🗺️ Interactive world map
- 🎯 Draw a circular selection area
- 🎲 Generate a random point within your selected area
- 🔗 Shareable/bookmarkable state via URL parameters
- 📱 Fully client-side application

## Use Cases

- Photography challenges
- Travel inspiration
- Spontaneous exploration
- Random location selection for games or activities

## Why PickRandomSpot?

Ever wanted to break out of your routine and discover a new spot? Whether you're a photographer looking for unique shooting locations, a traveler seeking unexpected destinations, or just someone who loves spontaneity, PickRandomSpot helps you find your next adventure with just a few clicks!

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn or pnpm

### Installation

1. Clone the repository

```bash
git clone https://github.com/shipurjan/PickRandomSpot.git
cd PickRandomSpot
```

2. Install dependencies

```bash
npm install
```

3. Run the development server

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

1. Pan and zoom the world map to your desired region
2. Click and drag to create a circular selection area
3. Click "Generate Random Point"
4. A marker will appear at a randomly selected location within your chosen area
5. Share the URL to save and share your specific selection!

## Technical Details

- Built with Next.js
- Uses `nuqs` for URL state management
- Fully client-side application
- Runs entirely in the user's browser

## Performance

The application is optimized for smooth interactions and quick random point generation, with all processing happening client-side.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Happy exploring! 🌍🚀
