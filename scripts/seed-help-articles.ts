/**
 * Story 5.10: Help System - Seed Help Articles
 *
 * Seeds the database with initial help articles content.
 */

import { PrismaClient } from '@prisma/client'
import { HELP_ARTICLES } from '../src/server/lib/help/help-articles'

const prisma = new PrismaClient()

async function seedHelpArticles() {
  console.log('📚 Seeding help articles...\n')

  try {
    // Clear existing help articles
    await prisma.helpArticle.deleteMany({})
    console.log('🗑️  Cleared existing help articles\n')

    // Create help articles
    for (const article of HELP_ARTICLES) {
      const created = await prisma.helpArticle.create({
        data: {
          title: article.title,
          slug: article.slug,
          description: article.description,
          content: article.content,
          category: article.category,
          context: article.context,
          keywords: article.keywords,
          order: article.order,
          relatedArticleIds: [], // Will be populated in second pass if needed
        },
      })

      console.log(`✅ Created: ${created.title} (${created.category})`)
    }

    console.log(`\n🎉 Successfully seeded ${HELP_ARTICLES.length} help articles!`)

    // Display summary by category
    const summary = await prisma.helpArticle.groupBy({
      by: ['category'],
      _count: true,
    })

    console.log('\n📊 Summary by category:')
    for (const item of summary) {
      console.log(`   ${item.category}: ${item._count} articles`)
    }
  } catch (error) {
    console.error('❌ Error seeding help articles:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedHelpArticles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
