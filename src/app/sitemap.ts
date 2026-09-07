import { MetadataRoute } from 'next'
import { toolsRegistry } from '@/lib/tools'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tools.andresgp.dev'
  
  const routes = ['', ...new Set(toolsRegistry.map((tool) => tool.path))]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
