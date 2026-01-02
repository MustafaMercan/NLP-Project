import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Stack,
  Pagination,
  Divider,
  Skeleton,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { fetchDataList, fetchCategories, fetchDataDetail } from '../api';

export default function DataList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [sortBy, setSortBy] = useState('scrapedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadData = async (page = 1, category = filters.category, search = filters.search, sort = sortBy, order = sortOrder) => {
    setLoading(true);
    try {
      const res = await fetchDataList({ page, limit: 10, category, search, sortBy: sort, sortOrder: order });
      setData(res.data || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0, limit: 10 });
    } catch (err) {
      console.error('Data fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats.categories || cats);
      } catch (err) {
        console.error('Category fetch error', err);
      }
      loadData(1);
    };
    init();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters((prev) => {
      loadData(1, prev.category, value, sortBy, sortOrder);
      return { ...prev, search: value };
    });
  };

  const handleCategory = (e) => {
    const value = e.target.value;
    setFilters((prev) => {
      loadData(1, value, prev.search, sortBy, sortOrder);
      return { ...prev, category: value };
    });
  };

  const handlePageChange = (_e, page) => {
    loadData(page, filters.category, filters.search, sortBy, sortOrder);
  };

  const handleRowClick = async (row) => {
    try {
      const detail = await fetchDataDetail(row._id);
      setSelected(detail.data || detail);
      setDetailOpen(true);
    } catch (err) {
      console.error('Detail fetch error', err);
    }
  };

  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    loadData(1, filters.category, filters.search, field, newOrder);
  };

  return (
    <>
      <Paper
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          border: '1px solid #1f2937',
          boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
        }}
      >
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Veriler
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Ara"
              value={filters.search}
              onChange={handleSearch}
              placeholder="Başlık veya içerik ara"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Kategori"
              value={filters.category}
              onChange={handleCategory}
            >
              <MenuItem value="">Tümü</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'title'}
                    direction={sortBy === 'title' ? sortOrder : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    Başlık
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'category'}
                    direction={sortBy === 'category' ? sortOrder : 'asc'}
                    onClick={() => handleSort('category')}
                  >
                    Kategori
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'confidence'}
                    direction={sortBy === 'confidence' ? sortOrder : 'asc'}
                    onClick={() => handleSort('confidence')}
                  >
                    Güven
                  </TableSortLabel>
                </TableCell>
                <TableCell>Sentiment</TableCell>
                <TableCell>Kaynak</TableCell>
              </TableRow>
            </TableHead>
              <TableBody>
                {loading
                  ? [...Array(6)].map((_, idx) => (
                      <TableRow key={idx}>
                        {[...Array(5)].map((__, cidx) => (
                          <TableCell key={cidx}>
                            <Skeleton variant="text" width="80%" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : data.map((row) => (
                      <TableRow
                        key={row._id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(row)}
                      >
                        <TableCell>{row.title}</TableCell>
                        <TableCell>
                          {row.classification?.category ? (
                            <Chip label={row.classification.category} size="small" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {row.classification?.confidence
                            ? row.classification.confidence.toFixed(2)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {row.classification?.sentiment ? (
                            <Chip
                              label={row.classification.sentiment}
                              size="small"
                              color={
                                row.classification.sentiment === 'positive'
                                  ? 'success'
                                  : row.classification.sentiment === 'negative'
                                  ? 'error'
                                  : 'default'
                              }
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{row.source}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TableContainer>

        <Stack direction="row" justifyContent="flex-end" sx={{ py: 2 }}>
          <Pagination
            count={pagination.pages || 1}
            page={pagination.page || 1}
            onChange={handlePageChange}
            color="primary"
          />
        </Stack>
      </Paper>

      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid #1f2937',
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Detay
            </Typography>
            <IconButton onClick={() => setDetailOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                {selected.title}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {selected.classification?.category && (
                  <Chip label={selected.classification.category} size="small" />
                )}
                {selected.classification?.confidence && (
                  <Chip
                    label={`Conf: ${selected.classification.confidence.toFixed(2)}`}
                    size="small"
                    color="info"
                  />
                )}
                {selected.classification?.sentiment && (
                  <Chip
                    label={selected.classification.sentiment}
                    size="small"
                    color={
                      selected.classification.sentiment === 'positive'
                        ? 'success'
                        : selected.classification.sentiment === 'negative'
                        ? 'error'
                        : 'default'
                    }
                  />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Kaynak: {selected.source}
              </Typography>
              <Divider sx={{ borderColor: '#1f2937' }} />
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {selected.content?.substring(0, 2000) || 'İçerik bulunamadı'}
              </Typography>
              {selected.url && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    URL:
                  </Typography>
                  <Typography
                    variant="body2"
                    component="a"
                    href={selected.url}
                    target="_blank"
                    rel="noreferrer"
                    sx={{ color: 'primary.main', wordBreak: 'break-all' }}
                  >
                    {selected.url}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

