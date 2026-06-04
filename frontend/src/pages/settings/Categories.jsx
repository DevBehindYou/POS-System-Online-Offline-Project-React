import React, { useEffect, useState } from 'react';
import apiClient from '../../utils/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);

  const loadCategories = async () => {
    const data = await apiClient.getCategories();
    setCategories(data);
  };

  useEffect(() => { loadCategories(); }, []);

  const saveCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) {
      await apiClient.updateCategory(editing.id, { name });
    } else {
      await apiClient.createCategory({ name });
    }
    setName('');
    setEditing(null);
    loadCategories();
  };

  const edit = (cat) => { setEditing(cat); setName(cat.name); };
  const remove = async (id) => {
    if (window.confirm('Delete this category?')) {
      await apiClient.deleteCategory(id);
      loadCategories();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Manage Categories</h1>

      <form onSubmit={saveCategory} className="flex gap-2 mb-4">
        <input
          className="input input-bordered flex-1"
          value={name}
          placeholder="Category Name"
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
      </form>

      <table className="table-auto w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id} className="border-t">
              <td className="p-2">{cat.name}</td>
              <td className="p-2 text-right space-x-2">
                <button className="btn btn-xs" onClick={() => edit(cat)}>Edit</button>
                <button className="btn btn-xs btn-error" onClick={() => remove(cat.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Categories;
