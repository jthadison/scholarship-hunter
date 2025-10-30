/**
 * LibraryFilters Component (Story 4.8 - Task 12)
 *
 * Sort and filter controls for essay library
 * AC1: Sort options (recent, quality, adaptable, alphabetical)
 * AC1: Filter by theme, word count range
 *
 * @module components/essay/library/LibraryFilters
 */

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { STANDARD_THEMES } from '@/server/services/essayThemeExtractor'

interface LibraryFiltersProps {
  sortBy: 'recent' | 'quality' | 'adaptable' | 'alphabetical'
  setSortBy: (value: 'recent' | 'quality' | 'adaptable' | 'alphabetical') => void
  filterThemes: string[]
  setFilterThemes: (themes: string[]) => void
  wordCountRange: [number | undefined, number | undefined]
  setWordCountRange: (range: [number | undefined, number | undefined]) => void
  availableThemes: string[]
}

/**
 * LibraryFilters Component
 * Sort and filter controls for library display
 */
export function LibraryFilters({
  sortBy,
  setSortBy,
  filterThemes,
  setFilterThemes,
  wordCountRange,
  setWordCountRange,
  availableThemes,
}: LibraryFiltersProps) {
  const handleAddThemeFilter = (theme: string) => {
    if (!filterThemes.includes(theme)) {
      setFilterThemes([...filterThemes, theme])
    }
  }

  const handleRemoveThemeFilter = (theme: string) => {
    setFilterThemes(filterThemes.filter(t => t !== theme))
  }

  return (
    <div className="space-y-4">
      {/* Sort By */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="sort-by" className="text-sm font-medium mb-2 block">
            Sort By
          </Label>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger id="sort-by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="quality">Highest Quality</SelectItem>
              <SelectItem value="adaptable">Most Adaptable</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Word Count Min */}
        <div>
          <Label htmlFor="word-count-min" className="text-sm font-medium mb-2 block">
            Min Word Count
          </Label>
          <Input
            id="word-count-min"
            type="number"
            placeholder="e.g., 500"
            value={wordCountRange[0] || ''}
            onChange={(e) =>
              setWordCountRange([e.target.value ? parseInt(e.target.value) : undefined, wordCountRange[1]])
            }
          />
        </div>

        {/* Word Count Max */}
        <div>
          <Label htmlFor="word-count-max" className="text-sm font-medium mb-2 block">
            Max Word Count
          </Label>
          <Input
            id="word-count-max"
            type="number"
            placeholder="e.g., 1000"
            value={wordCountRange[1] || ''}
            onChange={(e) =>
              setWordCountRange([wordCountRange[0], e.target.value ? parseInt(e.target.value) : undefined])
            }
          />
        </div>

        {/* Quick Word Count Filters */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quick Filters</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWordCountRange([500, 750])}
            >
              500-750
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWordCountRange([750, 1000])}
            >
              750-1000
            </Button>
          </div>
        </div>
      </div>

      {/* Theme Filters */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Filter by Themes</Label>

        {/* Active Theme Filters */}
        {filterThemes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {filterThemes.map((theme) => (
              <Badge key={theme} variant="secondary" className="pr-1">
                {theme.replace(/-/g, ' ')}
                <button
                  onClick={() => handleRemoveThemeFilter(theme)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Available Themes */}
        <div className="flex flex-wrap gap-2">
          {(availableThemes.length > 0 ? availableThemes : STANDARD_THEMES).map((theme) => (
            <Badge
              key={theme}
              variant={filterThemes.includes(theme) ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent"
              onClick={() =>
                filterThemes.includes(theme)
                  ? handleRemoveThemeFilter(theme)
                  : handleAddThemeFilter(theme)
              }
            >
              {theme.replace(/-/g, ' ')}
              {availableThemes.includes(theme) &&
                ` (${availableThemes.filter(t => t === theme).length})`}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
