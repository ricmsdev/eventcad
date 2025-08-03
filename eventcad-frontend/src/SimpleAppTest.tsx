import { useState } from 'react';

function SimpleAppTest() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center text-white max-w-md">
        <h1 className="text-4xl font-bold mb-4">🎉 EventCAD+</h1>
        <p className="text-xl mb-6">Sistema Avançado de Gestão de Eventos</p>
        
        <div className="bg-green-500 rounded-lg p-4 mb-6">
          ✅ React App Funcionando com Tailwind!
        </div>
        
        <div className="mb-6">
          <button 
            onClick={() => setCount(count + 1)}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Contador: {count}
          </button>
        </div>
        
        <div className="text-sm opacity-75">
          <p>✅ React: OK</p>
          <p>✅ TypeScript: OK</p>
          <p>✅ Tailwind CSS: OK</p>
          <p>✅ Estado (useState): OK</p>
          <p>✅ Docker: OK</p>
        </div>
      </div>
    </div>
  );
}

export default SimpleAppTest;