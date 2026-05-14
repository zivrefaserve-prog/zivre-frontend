import React, { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, FormControl, InputLabel, TextField, Box, Typography, IconButton, CircularProgress, Stepper, Step, StepLabel, Alert } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { getServices, getServiceComponents, createRequest } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const CustomServiceModal = ({ open, onClose, onSubmitSuccess }) => {
  const { user } = useAuth()
  const [activeStep, setActiveStep] = useState(0)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [components, setComponents] = useState([])
  const [quantities, setQuantities] = useState({})
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [location, setLocation] = useState({
    address: '',
    city: '',
    region: '',
    landmark: '',
    customer_phone: user?.phone || ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      getServices(true).then(res => setServices(res.data)).catch(console.error)
      setActiveStep(0)
      setSelectedService(null)
      setComponents([])
      setQuantities({})
      setTotal(0)
      setLocation({ ...location, customer_phone: user?.phone || '' })
      setError('')
    }
  }, [open, user])

  const handleServiceSelect = async (serviceId) => {
    setLoading(true)
    try {
      const res = await getServiceComponents(serviceId)
      setComponents(res.data)
      setSelectedService(services.find(s => s.id === serviceId))
      const initialQtys = {}
      res.data.forEach(c => { initialQtys[c.id] = 0 })
      setQuantities(initialQtys)
      setTotal(0)
      setActiveStep(1)
    } catch (err) {
      setError('Failed to load components')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = (componentId, price, delta) => {
    const newQty = Math.max(0, (quantities[componentId] || 0) + delta)
    const newQuantities = { ...quantities, [componentId]: newQty }
    setQuantities(newQuantities)
    const newTotal = components.reduce((sum, c) => sum + (newQuantities[c.id] || 0) * c.price, 0)
    setTotal(newTotal)
  }

  const handleNext = () => {
    if (activeStep === 1 && total === 0) {
      setError('Please select at least one component with quantity > 0')
      return
    }
    setError('')
    setActiveStep(2)
  }

  const handleBack = () => setActiveStep(activeStep - 1)

  const handleSubmit = async () => {
    if (!location.address || !location.city || !location.region || !location.customer_phone) {
      setError('Please fill all location and contact fields')
      return
    }
    setSubmitting(true)
    const componentsData = components.filter(c => quantities[c.id] > 0).map(c => ({
      component_id: c.id,
      name: c.name,
      quantity: quantities[c.id],
      price: c.price
    }))
    try {
      await createRequest({
        user_id: user.id,
        service_id: selectedService.id,
        components_data: componentsData,
        location_address: location.address,
        location_city: location.city,
        location_region: location.region,
        location_landmark: location.landmark,
        customer_phone: location.customer_phone
      })
      onSubmitSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const steps = ['Select Service', 'Choose Components', 'Location & Submit']

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Request Customized Service
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {activeStep === 0 && (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Service Category</InputLabel>
            <Select onChange={(e) => handleServiceSelect(e.target.value)}>
              {services.map(s => <MenuItem key={s.id} value={s.id}>{s.icon} {s.name}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        {activeStep === 1 && (
          <Box>
            {loading && <CircularProgress />}
            {components.map(c => (
              <Box key={c.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
                <Typography>{c.name} – GHS{c.price}</Typography>
                <Box>
                  <Button size="small" onClick={() => updateQuantity(c.id, c.price, -1)}>-</Button>
                  <span style={{ margin: '0 12px' }}>{quantities[c.id] || 0}</span>
                  <Button size="small" onClick={() => updateQuantity(c.id, c.price, 1)}>+</Button>
                </Box>
              </Box>
            ))}
            <Typography variant="h6" sx={{ mt: 2 }}>Total: GHS{total.toFixed(2)}</Typography>
          </Box>
        )}
        {activeStep === 2 && (
          <Box>
            <TextField fullWidth label="Street Address" margin="normal" value={location.address} onChange={e => setLocation({...location, address: e.target.value})} required />
            <TextField fullWidth label="City/Town" margin="normal" value={location.city} onChange={e => setLocation({...location, city: e.target.value})} required />
            <Select fullWidth displayEmpty value={location.region} onChange={e => setLocation({...location, region: e.target.value})} sx={{ mt: 2 }} required>
              <MenuItem value="" disabled>Select Region</MenuItem>
              {['Greater Accra','Ashanti','Western','Eastern','Central','Volta','Northern','Upper East','Upper West','Bono','Ahafo','Savannah','North East','Oti','Western North'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
            <TextField fullWidth label="Landmark (Optional)" margin="normal" value={location.landmark} onChange={e => setLocation({...location, landmark: e.target.value})} />
            <TextField fullWidth label="Phone Number" margin="normal" value={location.customer_phone} onChange={e => setLocation({...location, customer_phone: e.target.value})} required />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
        {activeStep < 2 && <Button variant="contained" onClick={handleNext} disabled={loading}>Next</Button>}
        {activeStep === 2 && <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: '#10b981' }}>{submitting ? <CircularProgress size={24} /> : 'Submit Request'}</Button>}
      </DialogActions>
    </Dialog>
  )
}

export default CustomServiceModal
