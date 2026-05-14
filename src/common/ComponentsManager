import React, { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { getServices, getServiceComponents, addServiceComponent, updateComponent, deleteComponent } from '../api/client'

const ComponentsManager = () => {
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState(null)
  const [formData, setFormData] = useState({ name: '', price: '' })

  useEffect(() => {
    getServices(false).then(res => setServices(res.data)).catch(console.error)
  }, [])

  const loadComponents = async (serviceId) => {
    setLoading(true)
    try {
      const res = await getServiceComponents(serviceId)
      setComponents(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId)
    setSelectedService(service)
    if (service) loadComponents(service.id)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.price) return
    setLoading(true)
    try {
      if (editingComponent) {
        await updateComponent(editingComponent.id, { name: formData.name, price: parseFloat(formData.price) })
      } else {
        await addServiceComponent(selectedService.id, { name: formData.name, price: parseFloat(formData.price) })
      }
      await loadComponents(selectedService.id)
      setModalOpen(false)
      setEditingComponent(null)
      setFormData({ name: '', price: '' })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this component?')) return
    setLoading(true)
    try {
      await deleteComponent(id)
      await loadComponents(selectedService.id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card sx={{ p: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Service Components</Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Service</InputLabel>
          <Select value={selectedService?.id || ''} onChange={e => handleServiceChange(e.target.value)}>
            {services.map(s => <MenuItem key={s.id} value={s.id}>{s.icon} {s.name}</MenuItem>)}
          </Select>
        </FormControl>
        {selectedService && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingComponent(null); setFormData({ name: '', price: '' }); setModalOpen(true); }}>Add Component</Button>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Price (GHS)</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {components.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.price}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => { setEditingComponent(c); setFormData({ name: c.name, price: c.price }); setModalOpen(true); }}><Edit /></IconButton>
                        <IconButton onClick={() => handleDelete(c.id)}><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </CardContent>
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
        <DialogTitle>{editingComponent ? 'Edit Component' : 'New Component'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Component Name" margin="normal" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <TextField fullWidth label="Price (GHS)" type="number" margin="normal" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name || !formData.price}>Save</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default ComponentsManager
