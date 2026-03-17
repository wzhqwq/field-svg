import { useAtom } from "jotai"
import { portfoliosAtom, currentPortfolioAtom } from "./base"
import { useEffect } from "react"


export function Portfolio() {
  const [portfolios, setPortfolios] = useAtom(portfoliosAtom)
  const [currentPortfolio, setCurrentPortfolio] = useAtom(currentPortfolioAtom)

  const handleSelect = (id: string) => {
    const portfolio = portfolios.find(p => p.id === id) || null
    setCurrentPortfolio(portfolio)
  }

  const handleCreate = () => {
    const newPortfolio = {
      id: crypto.randomUUID(),
      name: `Portfolio ${portfolios.length + 1}`,
      data: "",
    }
    setPortfolios([...portfolios, newPortfolio])
    setCurrentPortfolio(newPortfolio)
  }

  const handleDelete = (id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id))
    if (currentPortfolio?.id === id) {
      setCurrentPortfolio(null)
    }
  }

  useEffect(() => {
    if (currentPortfolio) {
      setPortfolios(prev => {
        const existingIndex = prev.findIndex(p => p.id === currentPortfolio.id)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = currentPortfolio
          return updated
        }
        return [...prev, currentPortfolio]
      })
    }
  }, [currentPortfolio])

  useEffect(() => {
    if (!currentPortfolio) {
      if (portfolios.length > 0) {
        setCurrentPortfolio(portfolios[0])
      }
    }
  }, [portfolios, currentPortfolio])

  return (
    <div className="Portfolio">
      <ul>
        {portfolios.map(p => (
          <li key={p.id} className={p.id === currentPortfolio?.id ? "selected" : ""}>
            <span className="title" onClick={() => handleSelect(p.id)}>{p.name}</span>
            <span className="delete" onClick={() => handleDelete(p.id)}>x</span>
          </li>
        ))}
        <li onClick={handleCreate} className="create">
          + Create New Portfolio
        </li>
      </ul>
    </div>
  )
}