import { useState, useEffect } from 'react'
import { categoryRepository } from '../db/repositories/categoryRepository'
import type { BookCategory } from '../types'

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
]

export function CategoriesPage() {
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', color: CATEGORY_COLORS[0] })

  const loadCategories = async () => {
    setIsLoading(true)
    const cats = await categoryRepository.getAll()
    setCategories(cats)
    setIsLoading(false)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.name.trim()) return

    await categoryRepository.create({
      name: newCategory.name,
      color: newCategory.color,
      bookIds: []
    })

    setNewCategory({ name: '', color: CATEGORY_COLORS[0] })
    setShowAddForm(false)
    loadCategories()
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category?')) {
      await categoryRepository.delete(id)
      loadCategories()
    }
  }

  if (isLoading) {
    return <div style={{ padding: 20 }}>Loading categories...</div>
  }

  return (
    <div className="categories-page" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Categories</h1>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          + Add Category
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddCategory} className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px 0' }}>New Category</h3>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              className="form-input"
              placeholder="Category name"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORY_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: newCategory.color === color ? '3px solid var(--app-text)' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {categories.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <div className="empty-state-title">No categories yet</div>
          <div className="empty-state-description">Create categories to organize your book collection.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map(category => (
            <div
              key={category.id}
              className="card"
              style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: category.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600
                }}
              >
                {category.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{category.name}</div>
                <div style={{ fontSize: 12, color: 'var(--app-text)', opacity: 0.6 }}>
                  {category.bookIds.length} books
                </div>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => handleDeleteCategory(category.id)}
                style={{ padding: '8px 12px' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
