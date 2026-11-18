import servicesData from '@/lib/data/services.json';

/** Same image paths as web homepage (`components/services-section.jsx`) */
const CATEGORY_IMAGES = {
  'home-appliances': '/image1.png',
  'kitchen-appliances': '/image1.png',
  'cleaning-pest': '/image5.png',
  handyman: '/image4.png',
  'packers-movers': '/image2.png',
  salon: '/image3.png',
};

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://homesxpert.in';

export function getCategories() {
  return servicesData.categories.map((cat) => {
    const imagePath = CATEGORY_IMAGES[cat.id];
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      imageUrl: imagePath ? `${SITE_ORIGIN}${imagePath}` : null,
      serviceCount: cat.services?.length || 0,
    };
  });
}

export function flattenServices(categoryId = null) {
  const results = [];
  for (const cat of servicesData.categories) {
    if (categoryId && cat.id !== categoryId) continue;
    for (const svc of cat.services || []) {
      const prices = (svc.subServices || [])
        .map((s) => (typeof s.price === 'number' ? s.price : null))
        .filter(Boolean);
      results.push({
        id: svc.id,
        categoryId: cat.id,
        categoryName: cat.name,
        name: svc.name,
        description: svc.description || '',
        priceMin: prices.length ? Math.min(...prices) : null,
        priceMax: prices.length ? Math.max(...prices) : null,
        subServices: (svc.subServices || []).map((sub, idx) => ({
          id: sub.id || `${svc.id}-sub-${idx}`,
          name: sub.name,
          price: sub.price,
        })),
      });
    }
  }
  return results;
}

export function getServiceById(id) {
  return flattenServices().find((s) => s.id === id) || null;
}

export function searchServices(query) {
  const q = query.toLowerCase();
  return flattenServices().filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.categoryName.toLowerCase().includes(q)
  );
}
