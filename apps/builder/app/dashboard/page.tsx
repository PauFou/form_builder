'use client';

import { useState } from 'react';
import { Button } from '@forms/ui';
import { Plus, Search, Grid, List, MoreVertical, Copy, Trash2, BarChart3, Users, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

type Form = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  responses: number;
  views: number;
  completionRate: number;
  lastModified: string;
  createdAt: string;
};

const mockForms: Form[] = [
  {
    id: 'frm_1',
    title: 'Customer Feedback Survey',
    slug: 'customer-feedback',
    status: 'published',
    responses: 1247,
    views: 3892,
    completionRate: 85,
    lastModified: '2025-09-09T10:00:00Z',
    createdAt: '2025-08-15T10:00:00Z'
  },
  {
    id: 'frm_2',
    title: 'Employee Satisfaction Form',
    slug: 'employee-satisfaction',
    status: 'published',
    responses: 542,
    views: 789,
    completionRate: 92,
    lastModified: '2025-09-08T15:30:00Z',
    createdAt: '2025-07-20T10:00:00Z'
  },
  {
    id: 'frm_3',
    title: 'Product Launch Registration',
    slug: 'product-launch',
    status: 'draft',
    responses: 0,
    views: 0,
    completionRate: 0,
    lastModified: '2025-09-09T14:20:00Z',
    createdAt: '2025-09-09T14:20:00Z'
  }
];

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Forms</h1>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create form
            </Button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search forms..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockForms.map((form, index) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group"
              >
                <div className="border rounded-2xl bg-card hover:shadow-lg transition-all overflow-hidden">
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{form.title}</h3>
                        <p className="text-sm text-muted-foreground">/{form.slug}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${
                        form.status === 'published' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          form.status === 'published' ? 'bg-success' : 'bg-muted-foreground'
                        }`} />
                        {form.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-muted-foreground">
                        Updated {new Date(form.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="border-t bg-muted/30 p-6 pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                          <Users className="h-4 w-4" />
                          Responses
                        </div>
                        <p className="text-xl font-semibold">{form.responses.toLocaleString()}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                          <Eye className="h-4 w-4" />
                          Views
                        </div>
                        <p className="text-xl font-semibold">{form.views.toLocaleString()}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                          <BarChart3 className="h-4 w-4" />
                          Rate
                        </div>
                        <p className="text-xl font-semibold">{form.completionRate}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t bg-muted/30 p-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-4 w-4 mr-1.5" />
                      Analytics
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium">Form</th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-left text-sm font-medium">Responses</th>
                  <th className="p-4 text-left text-sm font-medium">Views</th>
                  <th className="p-4 text-left text-sm font-medium">Completion Rate</th>
                  <th className="p-4 text-left text-sm font-medium">Last Modified</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {mockForms.map((form) => (
                  <tr key={form.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{form.title}</p>
                        <p className="text-sm text-muted-foreground">/{form.slug}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm ${
                        form.status === 'published' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          form.status === 'published' ? 'bg-success' : 'bg-muted-foreground'
                        }`} />
                        {form.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{form.responses.toLocaleString()}</td>
                    <td className="p-4 text-sm">{form.views.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{form.completionRate}%</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${form.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(form.lastModified).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}'