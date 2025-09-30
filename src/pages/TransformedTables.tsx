import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table2, Plus, Edit2, Trash2, X } from "lucide-react";
import {
  loadMetadata,
  saveMetadata,
  createTransformedTable,
  updateTransformedTable,
  deleteTransformedTable,
  addColumnToTable,
  updateColumnInTable,
  deleteColumnFromTable,
  type MetadataStore,
  type TransformedTable,
  type ColumnMeta
} from "@/lib/metadata";

export default function TransformedTables() {
  const [metadata, setMetadata] = useState<MetadataStore>({ transformedTables: [], featureGroups: [] });
  const [selectedTable, setSelectedTable] = useState<TransformedTable | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [showColumnDeleteDialog, setShowColumnDeleteDialog] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<ColumnMeta | null>(null);

  const [tableForm, setTableForm] = useState({
    name: '',
    description: ''
  });

  const [columnForm, setColumnForm] = useState<ColumnMeta>({
    name: '',
    dataType: 'text' as const,
    description: ''
  });

  // Error states for validation
  const [tableNameError, setTableNameError] = useState<string>('');
  const [columnNameError, setColumnNameError] = useState<string>('');

  // Duplicate validation functions
  const checkTableNameDuplicate = (name: string, excludeId?: string) => {
    if (!name.trim()) {
      setTableNameError('');
      return false;
    }

    const duplicate = metadata.transformedTables.find(table =>
      table.name.toLowerCase() === name.toLowerCase() && table.id !== excludeId
    );

    if (duplicate) {
      setTableNameError('A table with this name already exists');
      return true;
    }

    setTableNameError('');
    return false;
  };

  const checkColumnNameDuplicate = (name: string, tableId: string, excludeColumnName?: string) => {
    if (!name.trim()) {
      setColumnNameError('');
      return false;
    }

    const table = metadata.transformedTables.find(t => t.id === tableId);
    if (!table) {
      setColumnNameError('');
      return false;
    }

    const duplicate = table.columns.find(col =>
      col.name.toLowerCase() === name.toLowerCase() && col.name !== excludeColumnName
    );

    if (duplicate) {
      setColumnNameError('A column with this name already exists in this table');
      return true;
    }

    setColumnNameError('');
    return false;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadMetadata();
        setMetadata(data);
      } catch (error) {
        console.error('Failed to load metadata:', error);
      }
    };

    loadData();
  }, []);

  const resetTableForm = () => {
    setTableForm({ name: '', description: '' });
  };

  const resetColumnForm = () => {
    setColumnForm({ name: '', dataType: 'text', description: '' });
    setEditingColumn(null);
  };

  const handleCreateTable = async () => {
    if (!tableForm.name.trim()) return;

    try {
      const updatedMetadata = await createTransformedTable(metadata, {
        name: tableForm.name.trim(),
        description: tableForm.description.trim(),
        columns: []
      });

      setMetadata(updatedMetadata);
      setShowCreateDialog(false);
      resetTableForm();
    } catch (error) {
      console.error('Failed to create table:', error);
    }
  };

  const handleUpdateTable = async () => {
    if (!selectedTable || !tableForm.name.trim()) return;

    try {
      const updatedMetadata = await updateTransformedTable(metadata, selectedTable.id, {
        name: tableForm.name.trim(),
        description: tableForm.description.trim()
      });

      setMetadata(updatedMetadata);
      setSelectedTable({ ...selectedTable, name: tableForm.name.trim(), description: tableForm.description.trim() });
      setShowEditDialog(false);
      resetTableForm();
    } catch (error) {
      console.error('Failed to update table:', error);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      const updatedMetadata = await deleteTransformedTable(metadata, tableId);
      setMetadata(updatedMetadata);
      setShowDeleteDialog(null);
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Failed to delete table:', error);
    }
  };

  const handleCreateColumn = async () => {
    if (!selectedTable || !columnForm.name.trim()) return;

    try {
      const updatedMetadata = await addColumnToTable(metadata, selectedTable.id, {
        name: columnForm.name.trim(),
        dataType: columnForm.dataType,
        description: columnForm.description?.trim()
      });

      setMetadata(updatedMetadata);
      const updatedTable = updatedMetadata.transformedTables.find(t => t.id === selectedTable.id);
      if (updatedTable) setSelectedTable(updatedTable);
      setShowColumnDialog(false);
      resetColumnForm();
    } catch (error) {
      console.error('Failed to create column:', error);
    }
  };

  const handleUpdateColumn = async () => {
    if (!selectedTable || !editingColumn || !columnForm.name.trim()) return;

    try {
      const updatedMetadata = await updateColumnInTable(metadata, selectedTable.id, editingColumn.name, {
        name: columnForm.name.trim(),
        dataType: columnForm.dataType,
        description: columnForm.description?.trim()
      });

      setMetadata(updatedMetadata);
      const updatedTable = updatedMetadata.transformedTables.find(t => t.id === selectedTable.id);
      if (updatedTable) setSelectedTable(updatedTable);
      setShowColumnDialog(false);
      resetColumnForm();
    } catch (error) {
      console.error('Failed to update column:', error);
    }
  };

  const handleDeleteColumn = async (columnName: string) => {
    if (!selectedTable) return;

    try {
      const updatedMetadata = await deleteColumnFromTable(metadata, selectedTable.id, columnName);
      setMetadata(updatedMetadata);
      const updatedTable = updatedMetadata.transformedTables.find(t => t.id === selectedTable.id);
      if (updatedTable) setSelectedTable(updatedTable);
      setShowColumnDeleteDialog(null);
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  };

  const openTableSidebar = (table: TransformedTable) => {
    setSelectedTable(table);
    setShowSidebar(true);
  };

  const openEditDialog = (table: TransformedTable) => {
    setSelectedTable(table);
    setTableForm({ name: table.name, description: table.description });
    setTableNameError(''); // Clear any previous errors
    setShowEditDialog(true);
  };

  const openColumnDialog = (column?: ColumnMeta) => {
    if (column) {
      setEditingColumn(column);
      setColumnForm({ ...column });
    } else {
      resetColumnForm();
    }
    setColumnNameError(''); // Clear any previous errors
    setShowColumnDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transformed Tables</h1>
          <p className="text-muted-foreground text-sm">Manage transformed data tables and their column schemas.</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="self-start">
              <Plus className="h-4 w-4 mr-2" />
              New Transformed Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Transformed Table</DialogTitle>
              <DialogDescription>Define a new transformed table schema.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Table Name</label>
                <Input
                  value={tableForm.name}
                  onChange={e => {
                    const newName = e.target.value;
                    setTableForm(f => ({ ...f, name: newName }));
                    checkTableNameDuplicate(newName);
                  }}
                  onBlur={e => checkTableNameDuplicate(e.target.value)}
                  placeholder="e.g. transformed_user_events"
                  className={tableNameError ? "border-red-500" : ""}
                />
                {tableNameError && (
                  <p className="text-red-500 text-xs">{tableNameError}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Description</label>
                <Textarea
                  rows={3}
                  value={tableForm.description}
                  onChange={e => setTableForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the table and its purpose"
                  className="text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} size="sm">Cancel</Button>
                <Button size="sm" onClick={handleCreateTable} disabled={!tableForm.name.trim() || !!tableNameError}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {metadata.transformedTables.map(table => (
          <Card key={table.id} className="transition-shadow hover:shadow-md cursor-pointer">
            <button
              type="button"
              onClick={() => openTableSidebar(table)}
              className="text-left w-full"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base font-semibold break-all flex items-center gap-2">
                      <Table2 className="h-4 w-4 text-muted-foreground" />
                      <span>{table.name}</span>
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-3 leading-relaxed">
                      {table.description}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{table.columns.length} columns</Badge>
                </div>
              </CardHeader>
            </button>
            <CardContent className="text-xs text-muted-foreground pt-0">
              <div className="flex items-center justify-between">
                <span>Updated {new Date(table.updatedAt).toLocaleDateString()}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(table);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(table.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {metadata.transformedTables.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Table2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Transformed Tables</h3>
            <p className="text-muted-foreground text-sm mb-4">Get started by creating your first transformed table.</p>
            <Button onClick={() => {
              setTableForm({ name: '', description: '' });
              setTableNameError(''); // Clear any previous errors
              setShowCreateDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Transformed Table
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table Details Sidebar */}
      {showSidebar && selectedTable && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
          <div className="absolute top-0 right-0 h-full w-[75vw] max-w-[800px] bg-background border-l shadow-xl flex flex-col animate-in slide-in-from-right">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Table2 className="h-5 w-5" />
                  {selectedTable.name}
                </h2>
                <p className="text-xs text-muted-foreground">{selectedTable.columns.length} columns</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSidebar(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              <section className="space-y-2">
                <h3 className="font-medium text-foreground/80">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedTable.description || 'No description provided'}</p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground/80">Columns</h3>
                  <Button size="sm" onClick={() => openColumnDialog()}>
                    <Plus className="h-3 w-3 mr-1" />
                    New Column
                  </Button>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wide">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-medium">Column Name</th>
                        <th className="px-3 py-2 font-medium">Data Type</th>
                        <th className="px-3 py-2 font-medium">Description</th>
                        <th className="px-3 py-2 font-medium w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTable.columns.map(column => (
                        <tr key={column.name} className="border-t hover:bg-muted/40">
                          <td className="px-3 py-2 font-mono text-xs">{column.name}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">{column.dataType}</Badge>
                          </td>
                          <td className="px-3 py-2 text-xs max-w-[200px] truncate" title={column.description}>
                            {column.description || '-'}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => openColumnDialog(column)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => setShowColumnDeleteDialog(column.name)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {selectedTable.columns.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                            No columns defined yet.
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => openColumnDialog()}
                              className="ml-1 p-0 h-auto"
                            >
                              Add the first column
                            </Button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transformed Table</DialogTitle>
            <DialogDescription>Update table information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Table Name</label>
              <Input
                value={tableForm.name}
                onChange={e => {
                  const newName = e.target.value;
                  setTableForm(f => ({ ...f, name: newName }));
                  checkTableNameDuplicate(newName, selectedTable?.id);
                }}
                onBlur={e => checkTableNameDuplicate(e.target.value, selectedTable?.id)}
                placeholder="e.g. transformed_user_events"
                className={tableNameError ? "border-red-500" : ""}
              />
              {tableNameError && (
                <p className="text-red-500 text-xs">{tableNameError}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description</label>
              <Textarea
                rows={3}
                value={tableForm.description}
                onChange={e => setTableForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the table"
                className="text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} size="sm">Cancel</Button>
              <Button size="sm" onClick={handleUpdateTable} disabled={!tableForm.name.trim() || !!tableNameError}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Column Dialog */}
      <Dialog open={showColumnDialog} onOpenChange={setShowColumnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingColumn ? 'Edit Column' : 'Create Column'}</DialogTitle>
            <DialogDescription>
              {editingColumn ? 'Update column information.' : 'Define a new column for this table.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Column Name</label>
              <Input
                value={columnForm.name}
                onChange={e => {
                  const newName = e.target.value;
                  setColumnForm(f => ({ ...f, name: newName }));
                  if (selectedTable) {
                    checkColumnNameDuplicate(newName, selectedTable.id, editingColumn?.name);
                  }
                }}
                onBlur={e => {
                  if (selectedTable) {
                    checkColumnNameDuplicate(e.target.value, selectedTable.id, editingColumn?.name);
                  }
                }}
                placeholder="e.g. user_id, created_at"
                className={columnNameError ? "border-red-500" : ""}
              />
              {columnNameError && (
                <p className="text-red-500 text-xs">{columnNameError}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Data Type</label>
              <Select value={columnForm.dataType} onValueChange={v => setColumnForm(f => ({ ...f, dataType: v as any }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">text</SelectItem>
                  <SelectItem value="int">int</SelectItem>
                  <SelectItem value="float">float</SelectItem>
                  <SelectItem value="datetime">datetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description</label>
              <Textarea
                rows={2}
                value={columnForm.description || ''}
                onChange={e => setColumnForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional: describe this column's purpose"
                className="text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowColumnDialog(false)} size="sm">Cancel</Button>
              <Button
                size="sm"
                onClick={editingColumn ? handleUpdateColumn : handleCreateColumn}
                disabled={!columnForm.name.trim() || !!columnNameError}
              >
                {editingColumn ? 'Save Changes' : 'Create Column'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Table Dialog */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transformed Table</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this table? This action cannot be undone and will also remove any feature groups that reference this table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteDialog && handleDeleteTable(showDeleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Column Dialog */}
      <AlertDialog open={!!showColumnDeleteDialog} onOpenChange={() => setShowColumnDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this column? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showColumnDeleteDialog && handleDeleteColumn(showColumnDeleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Column
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
