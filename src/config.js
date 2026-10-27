// Free, keyless vector basemap (OpenFreeMap). Swap for MapTiler/Stadia/self-hosted if needed.
export const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

export const mapDefaults = {
  center: [121.774017, 12.879721], // [lng, lat] – Philippines
  zoom: 4.8,
  minZoom: 3.5,
  maxZoom: 14,
};

// Simplified version of the Google Form's first question group
export const submissionTypes = [
  { key: 'government', label: 'Government (City/Municipality)', short: 'Government' },
  { key: 'msme', label: 'MSME (fewer than 250 employees)', short: 'MSME' },
  { key: 'le', label: 'Large Enterprise (250+ employees)', short: 'Large enterprise' },
];

export const typeColors = {
  government: '#2f7d57',
  msme: '#2b8aa6',
  le: '#d99a2b',
};

export const ordinanceOptions = ['Yes', 'No', 'Not sure'];

// Straight from the form's "programs" checkboxes
export const programOptions = [
  { key: 'regulation', label: 'Regulation', hint: 'ban of plastic use' },
  { key: 'reduction', label: 'Reduction', hint: 'reduction rates, plastic tax, refilling systems, product redesign' },
  { key: 'recovery', label: 'Recovery', hint: 'recovery schemes, redemption, waste to composting' },
  { key: 'recycling', label: 'Recycling / upcycling', hint: 'eco-bricks, chairs, desks' },
  { key: 'disposal', label: 'Disposal', hint: 'plastic segregation and treatment' },
  { key: 'eco-products', label: 'Promote eco-friendly products', hint: 'bayong, eco-bags, reusables' },
  { key: 'incentives', label: 'Consumer incentives', hint: 'plastic-to-cash, plastics for groceries or points' },
  { key: 'community', label: 'Community engagement', hint: 'clean-up drives, coastal clean-ups' },
  { key: 'iec', label: 'Information & education campaign', hint: 'proper plastic waste disposal' },
  { key: 'consultation', label: 'Public consultation', hint: 'hearings and meetings on local policies' },
  { key: 'partnerships', label: 'Partnerships', hint: 'CSOs, IPs, waste sector, communities' },
];

export const ratingLabels = ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'];

export const sortOptions = [
  { key: 'newest', label: 'Newest first' },
  { key: 'rating', label: 'Highest self-rating' },
  { key: 'name', label: 'City / municipality (A–Z)' },
];

export const LOCAL_STORAGE_KEY = 'bawal-plastikan-demo-submissions';
export const PAGE_SIZE = 8;
