function SimpleApp() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <div style={{
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '40px',
        borderRadius: '10px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ fontSize: '3em', marginBottom: '10px' }}>🎉 EventCAD+</h1>
        <p style={{ fontSize: '1.2em', margin: '10px 0' }}>Sistema Avançado de Gestão de Eventos</p>
        <div style={{
          background: '#22c55e',
          padding: '10px 20px',
          borderRadius: '5px',
          margin: '20px 0'
        }}>
          ✅ React App Funcionando!
        </div>
        <p>Frontend carregado com sucesso!</p>
        <p>Porta: 8081 | Status: Online</p>
      </div>
    </div>
  )
}

export default SimpleApp