import api from './client';

export const fetchDataList = async (params = {}) => {
  const { data } = await api.get('/api/data', { params });
  return data;
};

export const fetchDataDetail = async (id) => {
  const { data } = await api.get(`/api/data/${id}`);
  return data;
};

export const fetchDataStats = async () => {
  const { data } = await api.get('/api/data/stats');
  return data;
};

export const fetchNlpStats = async () => {
  const { data } = await api.get('/api/nlp/stats');
  return data;
};

export const fetchCategories = async () => {
  const { data } = await api.get('/api/nlp/categories');
  return data;
};

