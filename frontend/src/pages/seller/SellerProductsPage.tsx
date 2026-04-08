import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/button'
import { LazyImage } from '@/components/ui/LazyImage'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { Plus, Package, Edit, Trash2, X } from 'lucide-react'

// Subcomponent: AddProductForm inline (no modal)
function AddProductForm({ onCancel, initialData }: { onCancel: () => void, initialData?: any }) {
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    sku: initialData?.sku || '',
    category_id: initialData?.category?.id || '',
    regular_price: initialData?.regular_price || '',
    price: initialData?.price || '',
    stock: initialData?.stock || '',
    status: initialData?.status || 'published',
    short_description: initialData?.short_description || '',
    description: initialData?.description || '',
    image_url: initialData?.images?.[0]?.image_url || ''
  })

  // We need categories for the select option
  const { data: categories } = useQuery({
    queryKey: ['mall-categories'],
    queryFn: () => api.get('/mall/categories/').then(r => r.data.data)
  })

  const mutation = useMutation({
    mutationFn: async () => {
       const payload = { ...formData }
       
       if (initialData) {
         // Patch existing
         return api.patch(`/mall/products/${initialData.id}/`, payload)
       } else {
         // POST new
         return api.post(`/mall/products/`, payload)
       }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      onCancel()
    }
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
         <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
           {initialData ? <Edit size={20} className="text-brand-primary" /> : <Plus size={20} className="text-brand-primary" />}
           {initialData ? 'Edit Product' : 'Add New Product'}
         </h2>
         <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-900 rounded-lg transition-colors"><X size={20} /></button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input required type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Wireless Mouse" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                   <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="e.g. Logitech" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                   <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. LOG-W100" />
                 </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select required className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary bg-white" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                   <option value="">Select Category</option>
                   {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
           </div>

           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                   <input required type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="৳0.00" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
                   <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" value={formData.regular_price} onChange={e => setFormData({...formData, regular_price: e.target.value})} placeholder="৳0.00" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level *</label>
                   <input required type="number" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                   <select className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                   </select>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
             <input type="url" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary text-sm" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://example.com/image.png" />
             {formData.image_url && <img src={formData.image_url} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-lg border" />}
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
             <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" value={formData.short_description} onChange={e => setFormData({...formData, short_description: e.target.value})} placeholder="Brief summary for listings..." />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Full Description <span className="text-gray-400 font-normal">(HTML Supported)</span></label>
             <textarea className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary font-mono text-sm" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="<p>Full description details...</p>" />
           </div>
        </div>
        
        {mutation.error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
             Failed to save product. Check fields or try again.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
           <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>Cancel</Button>
           <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save Product'}</Button>
        </div>

      </form>
    </div>
  )
}

export default function SellerProductsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const queryClient = useQueryClient()

  // Fetch paginated
  const { data, isLoading } = useQuery({
    queryKey: ['seller-products'],
    queryFn: () => api.get('/mall/products/?is_owner=true').then(r => r.data.data) // Querying own products
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/mall/products/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
    }
  })

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <>
      <Helmet><title>Products | Seller Center</title></Helmet>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-500 mt-1">Add, edit, or delete items from your store catalog.</p>
        </div>
        
        {!showForm && (
          <Button onClick={() => { setEditingProduct(null); setShowForm(true) }} className="shadow-sm">
             <Plus className="mr-2" size={18} /> Add New Product
          </Button>
        )}
      </div>

      {showForm && (
        <AddProductForm 
          initialData={editingProduct} 
          onCancel={() => { setShowForm(false); setEditingProduct(null) }} 
        />
      )}

      {/* Products Tabular View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
           <div className="p-8 text-center text-gray-500">Loading products...</div>
        ) : !data?.results || data.results.length === 0 ? (
           <div className="p-12 text-center text-gray-500 flex flex-col items-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border"><Package size={24} className="text-gray-400" /></div>
             <h3 className="text-lg font-bold text-gray-900 mb-1">No products yet</h3>
             <p className="text-gray-500 max-w-md">You haven't added any products to your store. Click "Add New Product" to get started.</p>
           </div>
        ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-gray-50/80 text-gray-500 font-medium border-b">
                 <tr>
                   <th className="px-6 py-4">Product</th>
                   <th className="px-6 py-4">Brand/SKU</th>
                   <th className="px-6 py-4">Price</th>
                   <th className="px-6 py-4">Stock</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {data.results.map((product: any) => (
                   <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded border bg-gray-50 overflow-hidden shrink-0">
                            {product.images?.[0] ? <LazyImage src={product.images[0].image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No Img</div>}
                         </div>
                         <div>
                            <p className="font-bold text-gray-900 max-w-[200px] truncate">{product.name}</p>
                            <p className="text-xs text-brand-primary bg-brand-primary/10 inline-block px-1.5 py-0.5 rounded mt-0.5">{product.category?.name || 'Uncategorized'}</p>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4 text-gray-600">
                       <div className="flex flex-col">
                         <span>{product.brand || '-'}</span>
                         <span className="text-xs text-gray-400 font-mono mt-0.5">{product.sku || 'N/A'}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <CurrencyDisplay amount={product.price} className="font-bold text-gray-900" />
                       {product.regular_price > product.price && <div className="text-xs line-through text-gray-400"><CurrencyDisplay amount={product.regular_price} /></div>}
                     </td>
                     <td className="px-6 py-4">
                       <span className={`font-semibold ${product.stock <= 5 ? (product.stock === 0 ? 'text-red-500' : 'text-orange-500') : 'text-green-600'}`}>
                         {product.stock}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                         {product.is_active ? 'Published' : 'Draft'}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit size={16} /></button>
                         <button onClick={() => handleDelete(String(product.id))} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16} /></button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>

    </>
  )
}
