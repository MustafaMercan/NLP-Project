import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Divider,
  Box,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Link,
  Card,
  CardContent,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { fetchDataStats, fetchNlpStats } from '../api';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CategoryIcon from '@mui/icons-material/Category';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import ArticleIcon from '@mui/icons-material/Article';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const COLORS = ['#60a5fa', '#c084fc', '#fb923c', '#34d399', '#f87171', '#a5b4fc'];
const SENTIMENT_COLORS = {
  positive: '#34d399',
  negative: '#f87171',
  neutral: '#60a5fa',
};

const StatCard = ({ title, value, sub, icon, color = '#60a5fa', progress }) => {
  const IconComponent = icon;
  return (
    <Paper
      sx={{
        p: 2.5,
        bgcolor: 'background.paper',
        border: '1px solid #1f2937',
        boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 15px 50px rgba(0,0,0,0.45)',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {sub}
            </Typography>
          )}
          {progress !== undefined && (
            <Box sx={{ mt: 1.5 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#1f2937',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: color,
                  },
                }}
              />
            </Box>
          )}
        </Box>
        {IconComponent && (
          <Box
            sx={{
              bgcolor: `${color}20`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComponent sx={{ fontSize: 32, color }} />
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dataStats, setDataStats] = useState(null);
  const [nlpStats, setNlpStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dStats, nStats] = await Promise.all([fetchDataStats(), fetchNlpStats()]);
        setDataStats(dStats?.stats || dStats);
        setNlpStats(nStats?.stats || nStats);
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const classificationRate =
    dataStats?.totalScraped > 0
      ? ((nlpStats?.totalClassified || 0) / dataStats.totalScraped) * 100
      : 0;

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 2 }}>
      <Stack spacing={3}>
        {/* KPI Cards - Row 1 */}
        <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Veri"
            value={dataStats?.totalScraped || 0}
            sub="ScrapedData"
            icon={ArticleIcon}
            color="#60a5fa"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sınıflandırılmış"
            value={nlpStats?.totalClassified || 0}
            sub="ClassifiedData"
            icon={AutoAwesomeIcon}
            color="#c084fc"
            progress={classificationRate}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sınıflandırılmamış"
            value={nlpStats?.totalUnclassified || 0}
            sub="StructuredContent"
            icon={CategoryIcon}
            color="#fb923c"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ortalama Güven"
            value={(nlpStats?.avgConfidence || 0).toFixed(2)}
            sub="0-1 arası"
            icon={AssessmentIcon}
            color="#34d399"
            progress={(nlpStats?.avgConfidence || 0) * 100}
          />
        </Grid>
      </Grid>

      {/* KPI Cards - Row 2 */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Kelime"
            value={formatNumber(nlpStats?.totalWords || 0)}
            sub="StructuredContent"
            icon={ArticleIcon}
            color="#a5b4fc"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Son 24 Saat"
            value={dataStats?.recent24h || 0}
            sub="Yeni eklenen veri"
            icon={TrendingUpIcon}
            color="#f87171"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Max Güven"
            value={(nlpStats?.maxConfidence || 0).toFixed(2)}
            sub="En yüksek skor"
            icon={TrendingUpIcon}
            color="#34d399"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sınıflandırma Oranı"
            value={`${classificationRate.toFixed(1)}%`}
            sub="Başarı oranı"
            icon={SentimentSatisfiedIcon}
            color="#c084fc"
            progress={classificationRate}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2.5,
              height: 440,
              bgcolor: 'background.paper',
              border: '1px solid #1f2937',
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={1}>
              Kategori Dağılımı
            </Typography>
            <Divider sx={{ mb: 2, borderColor: '#1f2937' }} />
            <Box sx={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={320}>
                <PieChart>
                  <Pie
                    data={nlpStats?.categoryStats || []}
                    dataKey="count"
                    nameKey="_id"
                    outerRadius="65%"
                    innerRadius="45%"
                    paddingAngle={2}
                    labelLine={false}
                  >
                    {(nlpStats?.categoryStats || []).map((entry, index) => (
                      <Cell key={entry._id} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: 8,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    layout="horizontal"
                    height={48}
                    wrapperStyle={{ fontSize: 12, color: '#e5e7eb', marginTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2.5,
              height: 440,
              bgcolor: 'background.paper',
              border: '1px solid #1f2937',
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={1}>
              Sentiment Dağılımı
            </Typography>
            <Divider sx={{ mb: 2, borderColor: '#1f2937' }} />
            <Box sx={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={320}>
                <PieChart>
                  <Pie
                    data={nlpStats?.sentimentStats || []}
                    dataKey="count"
                    nameKey="_id"
                    outerRadius="65%"
                    innerRadius="45%"
                    paddingAngle={3}
                    labelLine={false}
                  >
                    {(nlpStats?.sentimentStats || []).map((entry) => (
                      <Cell
                        key={entry._id}
                        fill={SENTIMENT_COLORS[entry._id] || COLORS[0]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: 8,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    layout="horizontal"
                    height={48}
                    wrapperStyle={{ fontSize: 12, color: '#e5e7eb', marginTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Bar Chart and Recent Data Row */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2.5,
              minHeight: 400,
              bgcolor: 'background.paper',
              border: '1px solid #1f2937',
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={1}>
              Kategori Bazında Detaylı İstatistikler
            </Typography>
            <Divider sx={{ mb: 2, borderColor: '#1f2937' }} />
            {(nlpStats?.categoryStats && nlpStats.categoryStats.length > 0) ? (
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nlpStats.categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="_id"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fill: '#e5e7eb', fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: '#e5e7eb', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #1f2937',
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="count" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 320,
                  color: 'text.secondary',
                }}
              >
                <AssessmentIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">Kategori verisi yok</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2.5,
              height: 400,
              bgcolor: 'background.paper',
              border: '1px solid #1f2937',
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={1}>
              Son Eklenen Veriler
            </Typography>
            <Divider sx={{ mb: 2, borderColor: '#1f2937' }} />
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {(dataStats?.recentScrapes && dataStats.recentScrapes.length > 0) ? (
                <Grid container spacing={1.5}>
                  {dataStats.recentScrapes.map((item, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Card
                        sx={{
                          bgcolor: '#111827',
                          border: '1px solid #1f2937',
                          p: 1.5,
                          height: '100%',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: '#1a1f2e',
                            borderColor: '#374151',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          },
                        }}
                      >
                        <Link
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          sx={{
                            color: '#60a5fa',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            display: 'block',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            '&:hover': { textDecoration: 'underline', color: '#93c5fd' },
                          }}
                        >
                          {item.title || 'Başlıksız'}
                        </Link>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.scrapedAt).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            •
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.scrapedAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </Stack>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                  }}
                >
                  <ArticleIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2">Henüz veri yok</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Confidence and Category Avg Confidence */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2.5,
              minHeight: 400,
              bgcolor: 'background.paper',
              border: '1px solid #1f2937',
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={1}>
              En Yüksek Güven Skorları
            </Typography>
            <Divider sx={{ mb: 2, borderColor: '#1f2937' }} />
            {(nlpStats?.topConfidence && nlpStats.topConfidence.length > 0) ? (
              <Stack spacing={1.5}>
                {nlpStats.topConfidence.map((item, idx) => (
                  <Card
                    key={idx}
                    sx={{
                      bgcolor: '#111827',
                      border: '1px solid #1f2937',
                      p: 1.5,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#1a1f2e',
                        borderColor: '#374151',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 0.5,
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Chip
                          label={item.category}
                          size="small"
                          sx={{
                            mt: 0.5,
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                          }}
                        />
                      </Box>
                      <Chip
                        label={item.confidence.toFixed(2)}
                        color="success"
                        size="small"
                        sx={{ ml: 1.5, fontWeight: 700 }}
                      />
                    </Stack>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 4,
                  color: 'text.secondary',
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">Henüz sınıflandırma yapılmadı</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2.5,
              minHeight: 400,
              bgcolor: 'background.paper',
              border: '1px solid #1f2937',
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={1}>
              Kategori Ortalama Güven Skorları
            </Typography>
            <Divider sx={{ mb: 2, borderColor: '#1f2937' }} />
            {(nlpStats?.categoryAvgConfidence && nlpStats.categoryAvgConfidence.length > 0) ? (
              <Stack spacing={2}>
                {nlpStats.categoryAvgConfidence.map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.5,
                      bgcolor: '#111827',
                      borderRadius: 1.5,
                      border: '1px solid #1f2937',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: '#1a1f2e',
                        borderColor: '#374151',
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {item._id}
                      </Typography>
                      <Chip
                        label={item.avgConfidence.toFixed(2)}
                        size="small"
                        sx={{
                          bgcolor: `${COLORS[idx % COLORS.length]}20`,
                          color: COLORS[idx % COLORS.length],
                          fontWeight: 700,
                          height: 24,
                        }}
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={item.avgConfidence * 100}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: '#1f2937',
                        mb: 0.5,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: COLORS[idx % COLORS.length],
                          borderRadius: 5,
                        },
                      }}
                    />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {item.count} veri
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {((item.count / (nlpStats?.totalClassified || 1)) * 100).toFixed(1)}%
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 4,
                  color: 'text.secondary',
                }}
              >
                <CategoryIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">Kategori verisi yok</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      </Stack>
    </Box>
  );
}

