#!/usr/bin/env node
/**
 * One-time splitter: extracts feature components from src/App.jsx
 * Run: node scripts/split-app-modules.mjs
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const appPath = path.join(root, 'src/App.jsx');
const source = fs.readFileSync(appPath, 'utf8');

const sharedImports = `import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/contexts/AuthContext';
import { useCrmModal } from '@/contexts/CrmModalContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2, Plus, TrendingUp, DollarSign, Users, Target, ShoppingCart, GripVertical, MapPin, Building2, Mail, Phone, Edit2, Trash2, ArrowRightCircle, Package, AlertTriangle, FileText, Clock, CheckCircle, XCircle, Send, BarChart3, PieChart, Activity, Zap, Settings, UserPlus, Wrench, Headphones, Download, Filter, Eye, FileDown, Calendar, RefreshCw, Copy, Check, X, ChevronRight, Sparkles, Bot, Lightbulb, TrendingDown, UsersRound, Receipt, CreditCard, FileCheck, Workflow, Play, Pause, Clock3, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '@/store/useStore';
import {
  formatCurrency,
  getRangeFromPreset,
  isInRange,
  pipelineTotals,
  sumOrdersTotal,
  buildFunnelRows,
  buildLast6MonthsOrderTrend,
  countEntities,
} from '@/lib/crmMetrics';
import { exportWorkbook } from '@/lib/exportExcel';
import { invokeCrmAi } from '@/lib/crmAi';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/auth';
import { confirmDelete } from '@/lib/confirmDelete';
import { PAGE_TITLES, STAGE_COLORS } from '@/config/crm';
`;

const blocks = [
  { name: 'DashboardContent', file: 'src/features/dashboard/DashboardContent.jsx', start: 'function DashboardContent', end: '\n// Login Page Component' },
  { name: 'LoginPage', file: 'src/features/auth/LoginPage.jsx', start: 'function LoginPage', end: '\n// Loading Screen' },
  { name: 'LoadingScreen', file: 'src/features/auth/LoadingScreen.jsx', start: 'function LoadingScreen', end: '\n// Main App' },
  { name: 'CustomersContent', file: 'src/features/customers/CustomersContent.jsx', start: '// Customers Page\nfunction CustomersContent', end: '\n// Leads Page' },
  { name: 'LeadsContent', file: 'src/features/leads/LeadsContent.jsx', start: '// Leads Page\nfunction LeadsContent', end: '\n// Products Page' },
  { name: 'ProductsContent', file: 'src/features/products/ProductsContent.jsx', start: '// Products Page\nfunction ProductsContent', end: '\nfunction OpportunityCard' },
  { name: 'PipelineContent', file: 'src/features/pipeline/PipelineContent.jsx', start: 'function OpportunityCard', end: '\n// Quotations Page' },
  { name: 'QuotationsContent', file: 'src/features/quotations/QuotationsContent.jsx', start: '// Quotations Page\nfunction QuotationsContent', end: '\n// Orders Page' },
  { name: 'OrdersContent', file: 'src/features/orders/OrdersContent.jsx', start: '// Orders Page\nfunction OrdersContent', end: '\nfunction triggerActionLabel' },
  { name: 'AutomationsContent', file: 'src/features/automations/AutomationsContent.jsx', start: '// Automatizaciones', end: '\nfunction MetaContent' },
  { name: 'MetaContent', file: 'src/features/meta/MetaContent.jsx', start: 'function MetaContent', end: '\n// Reports Page' },
  { name: 'ReportsContent', file: 'src/features/reports/ReportsContent.jsx', start: '// Reports Page', end: '\n// AI Page' },
  { name: 'AIContent', file: 'src/features/ai/AIContent.jsx', start: '// AI Page', end: '\nfunction ticketDisplay' },
  { name: 'PostsaleContent', file: 'src/features/postsale/PostsaleContent.jsx', start: 'function ticketDisplay', end: '\n// Settings Page' },
  { name: 'SettingsContent', file: 'src/features/settings/SettingsContent.jsx', start: '// Settings Page\nfunction SettingsContent', end: '\n// Users Page' },
  { name: 'UsersContent', file: 'src/features/users/UsersContent.jsx', start: '// Users Page\nfunction UsersContent', end: null },
];

function sliceBlock(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing start: ${startMarker}`);
  const end = endMarker ? source.indexOf(endMarker, start + 1) : source.length;
  if (end < 0) throw new Error(`Missing end: ${endMarker}`);
  return source.slice(start, end).trim();
}

// constants
const constBlock = source.slice(source.indexOf('const PAGE_TITLES'), source.indexOf('function DashboardContent')).trim();
fs.mkdirSync(path.join(root, 'src/config'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/config/crm.js'), `${constBlock}\n\nexport { PAGE_TITLES, STAGE_COLORS };\n`);

// app shell
const appStart = source.indexOf('export default function App');
const appEnd = source.indexOf('// Customers Page');
const appShell = source.slice(appStart, appEnd).trim();

for (const block of blocks) {
  const body = sliceBlock(block.start, block.end);
  const exportName = block.name;
  const isDefault = ['LoginPage', 'LoadingScreen'].includes(exportName);
  const dir = path.dirname(path.join(root, block.file));
  fs.mkdirSync(dir, { recursive: true });
  const fnBody = body.trim();
  const exported = fnBody.replace(
    new RegExp(`function ${exportName}\\b`),
    `export function ${exportName}`
  );
  const content = `${sharedImports}\n\n${exported}\n`;
  fs.writeFileSync(path.join(root, block.file), content);
}

const featureImports = blocks
  .map((b) => {
    const mod = b.file.replace('src/', '@/').replace('.jsx', '');
    return `import { ${b.name} } from '${mod}';`;
  })
  .join('\n');

const newApp = `${sharedImports}
${featureImports}
import { CrmModalsHost } from '@/components/CrmModalsHost';

${appShell}
`;

fs.mkdirSync(path.join(root, 'src/app'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/app/App.jsx'), newApp);
console.log('Split complete: src/app/App.jsx + feature modules');
