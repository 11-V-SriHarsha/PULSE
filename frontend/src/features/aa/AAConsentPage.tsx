import Card from '../../components/ui/Card'

export default function AAConsentPage() {
  return (
    <Card className="p-4">
      <div className="font-medium mb-2">AA Consent</div>
      <div className="text-sm text-gray-600">In a real flow, you’d land here after consent, then we’d poll status. Using mock AA, go to Import and click “Import from AA”.</div>
    </Card>
  )
}
