import api from './client';

export const categoryService = {
  getCategories: async () => {
    const response = await api.get('/api/categories');
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/api/categories', categoryData);
    return response.data;
  },

  updateCategory: async (categoryId, categoryData) => {
    const response = await api.put(`/api/categories/${categoryId}`, categoryData);
    return response.data;
  },

  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/api/categories/${categoryId}`);
    return response.data;
  }
};
