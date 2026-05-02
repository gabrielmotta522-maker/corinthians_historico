import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, Filter, RotateCcw } from "lucide-react";
import jogadoresData from "@/data/jogadores-completo.json";

interface Jogador {
  nome: string;
  total_jogos: number;
  total_gols: number;
  jogos_por_ano: Record<string, number | undefined>;
  gols_por_ano: Record<string, number | undefined>;
  anos_atuou: number[];
}

export default function Home() {
  const [jogadores, setJogadores] = useState<Jogador[]>(jogadoresData);
  const [filtrados, setFiltrados] = useState<Jogador[]>(jogadoresData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAno, setFilterAno] = useState("");
  const [filterMinJogos, setFilterMinJogos] = useState("0");
  const [sortBy, setSortBy] = useState("total_jogos");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedJogador, setSelectedJogador] = useState<Jogador | null>(null);
  const [editingCell, setEditingCell] = useState<{ nome: string; field: 'total_jogos' | 'total_gols' } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Aplicar filtros
  useEffect(() => {
    let result = [...jogadores];

    if (searchTerm) {
      result = result.filter(j => j.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (filterAno && filterAno !== "all") {
      result = result.filter(j => j.anos_atuou.includes(parseInt(filterAno)));
    }

    const minJogos = parseInt(filterMinJogos) || 0;
    result = result.filter(j => j.total_jogos >= minJogos);

    // Ordenar
    result.sort((a, b) => {
      let aVal: any = a[sortBy as keyof Jogador];
      let bVal: any = b[sortBy as keyof Jogador];

      if (sortBy === "media_gols") {
        aVal = a.total_jogos > 0 ? a.total_gols / a.total_jogos : 0;
        bVal = b.total_jogos > 0 ? b.total_gols / b.total_jogos : 0;
      }

      if (typeof aVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    setFiltrados(result);
    setCurrentPage(1);
  }, [searchTerm, filterAno, filterMinJogos, sortBy, sortDir, jogadores]);

  const totalStats = useMemo(() => ({
    totalJogadores: jogadores.length,
    totalJogos: jogadores.reduce((s, j) => s + j.total_jogos, 0),
    totalGols: jogadores.reduce((s, j) => s + j.total_gols, 0),
    topJogador: jogadores[0],
    topArtilheiro: [...jogadores].sort((a, b) => b.total_gols - a.total_gols)[0],
  }), [jogadores]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtrados.slice(start, start + itemsPerPage);
  }, [filtrados, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtrados.length / itemsPerPage);

  const top10Jogos = useMemo(() => 
    [...jogadores].sort((a, b) => b.total_jogos - a.total_jogos).slice(0, 10),
    [jogadores]
  );

  const top10Gols = useMemo(() => 
    [...jogadores].sort((a, b) => b.total_gols - a.total_gols).slice(0, 10),
    [jogadores]
  );

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir(field === "nome" ? "asc" : "desc");
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setFilterAno("");
    setFilterMinJogos("0");
    setSortBy("total_jogos");
    setSortDir("desc");
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const rows = [["#", "Jogador", "Total Jogos", "Total Gols", "Média Gols/Jogo", "Temporadas", "Anos"]];
    filtrados.forEach((j, i) => {
      rows.push([
        String(i + 1),
        j.nome,
        String(j.total_jogos),
        String(j.total_gols),
        j.total_jogos > 0 ? (j.total_gols / j.total_jogos).toFixed(2) : "0.00",
        String(j.anos_atuou.length),
        j.anos_atuou.join(";"),
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "corinthians_jogadores_2015_2026.csv";
    link.click();
  };

  const handleCellEdit = (jogadorNome: string, field: 'total_jogos' | 'total_gols', value: string) => {
    setEditingCell({ nome: jogadorNome, field });
    setEditValue(value);
  };

  const handleSaveEdit = (jogadorNome: string) => {
    if (!editingCell || editValue === "") return;
    
    const newValue = parseInt(editValue) || 0;
    const updatedJogadores = jogadores.map(j => {
      if (j.nome === jogadorNome) {
        if (editingCell.field === 'total_jogos') {
          return { ...j, total_jogos: newValue };
        } else if (editingCell.field === 'total_gols') {
          return { ...j, total_gols: newValue };
        }
      }
      return j;
    });
    
    setJogadores(updatedJogadores);
    setEditingCell(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-amber-900/30 bg-black/40 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-xl font-black text-black">SC</span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-amber-400 tracking-tight">HISTÓRICO CORINTHIANS</h1>
              <p className="text-sm text-slate-400 mt-1">Jogadores que vestiram a camisa — 2015 a 2026 · Fonte: meutimao.com.br</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">2015–2026</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="border-b border-slate-800/50 bg-black/20 backdrop-blur-sm">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card className="bg-slate-900/50 border-slate-800 p-4 text-center">
              <div className="text-2xl font-black text-amber-400">{totalStats.totalJogadores}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-2">Jogadores Únicos</div>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800 p-4 text-center">
              <div className="text-2xl font-black text-amber-400">{totalStats.totalJogos.toLocaleString()}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-2">Total de Jogos</div>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800 p-4 text-center">
              <div className="text-2xl font-black text-red-400">{totalStats.totalGols.toLocaleString()}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-2">Total de Gols</div>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800 p-4 text-center">
              <div className="text-2xl font-black text-cyan-400">12</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-2">Temporadas</div>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800 p-4 text-center">
              <div className="text-lg font-black text-amber-400">{totalStats.topJogador.nome.split(" ")[0]}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-2">Mais jogos: {totalStats.topJogador.total_jogos}</div>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800 p-4 text-center">
              <div className="text-lg font-black text-red-400">{totalStats.topArtilheiro.nome.split(" ")[0]}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-2">Mais gols: {totalStats.topArtilheiro.total_gols}</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">Top 10 — Total de Jogos</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top10Jogos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nome" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                <Bar dataKey="total_jogos" fill="#fbbf24" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">Top 10 — Total de Gols</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top10Gols}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nome" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                <Bar dataKey="total_gols" fill="#f87171" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="container py-6 border-t border-slate-800/50">
        <div className="flex flex-wrap gap-3 mb-6">
          <Input
            placeholder="Buscar jogador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 flex-1 min-w-[200px]"
          />

          <Select value={filterAno} onValueChange={setFilterAno}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100 w-[150px]">
              <SelectValue placeholder="Filtrar por ano" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">Todos os anos</SelectItem>
              {Array.from({ length: 12 }, (_, i) => 2015 + i).map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterMinJogos} onValueChange={setFilterMinJogos}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100 w-[140px]">
              <SelectValue placeholder="Mínimo de jogos" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="0">Todos os jogos</SelectItem>
              <SelectItem value="10">10+</SelectItem>
              <SelectItem value="25">25+</SelectItem>
              <SelectItem value="50">50+</SelectItem>
              <SelectItem value="100">100+</SelectItem>
              <SelectItem value="200">200+</SelectItem>
            </SelectContent>
          </Select>

          <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(parseInt(v))}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100 w-[140px]">
              <SelectValue placeholder="Itens por página" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="9999">Todos</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleReset} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar
          </Button>

          <Button size="sm" onClick={handleExportCSV} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <div className="text-sm text-slate-400">
          {filtrados.length} jogador(es) encontrado(s)
        </div>
      </div>

      {/* Table */}
      <div className="container py-6">
        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800" onClick={() => handleSort("rank")}>#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800" onClick={() => handleSort("nome")}>Jogador</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-amber-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800" onClick={() => handleSort("total_jogos")}>Jogos {sortBy === "total_jogos" && (sortDir === "asc" ? "▲" : "▼")}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-amber-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800" onClick={() => handleSort("total_gols")}>Gols {sortBy === "total_gols" && (sortDir === "asc" ? "▲" : "▼")}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800" onClick={() => handleSort("media_gols")}>Média Gols/Jogo {sortBy === "media_gols" && (sortDir === "asc" ? "▲" : "▼")}</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-amber-400 uppercase tracking-wider">Temporadas</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-amber-400 uppercase tracking-wider">Anos</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-amber-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((jogador, idx) => {
                  const rank = (currentPage - 1) * itemsPerPage + idx + 1;
                  const media = jogador.total_jogos > 0 ? (jogador.total_gols / jogador.total_jogos).toFixed(2) : "0.00";
                  const rowClass = rank === 1 ? "bg-amber-500/10" : rank === 2 ? "bg-amber-500/5" : rank === 3 ? "bg-amber-500/[0.02]" : "";

                  return (
                    <tr key={jogador.nome} className={`border-b border-slate-800 hover:bg-slate-800/50 transition ${rowClass}`}>
                      <td className="px-4 py-3 font-bold text-slate-400">{rank}</td>
                      <td className="px-4 py-3 font-semibold text-slate-100">{jogador.nome}</td>
                      <td className="px-4 py-3 text-center font-bold text-amber-400 cursor-pointer hover:bg-slate-700/50 rounded transition" onClick={() => handleCellEdit(jogador.nome, 'total_jogos', String(jogador.total_jogos))}>
                        {editingCell?.nome === jogador.nome && editingCell?.field === 'total_jogos' ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-16 px-2 py-1 bg-slate-800 border border-amber-400 rounded text-amber-400 text-center"
                              autoFocus
                              onBlur={() => handleSaveEdit(jogador.nome)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(jogador.nome);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          </div>
                        ) : (
                          jogador.total_jogos
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-red-400 cursor-pointer hover:bg-slate-700/50 rounded transition" onClick={() => handleCellEdit(jogador.nome, 'total_gols', String(jogador.total_gols))}>
                        {editingCell?.nome === jogador.nome && editingCell?.field === 'total_gols' ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-16 px-2 py-1 bg-slate-800 border border-red-400 rounded text-red-400 text-center"
                              autoFocus
                              onBlur={() => handleSaveEdit(jogador.nome)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(jogador.nome);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                          </div>
                        ) : (
                          jogador.total_gols
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-cyan-400">{media}</td>
                      <td className="px-4 py-3 text-center text-slate-300">{jogador.anos_atuou.length}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {jogador.anos_atuou.map(ano => (
                          <span key={ano} className="inline-block bg-slate-800 px-2 py-1 rounded mr-1 mb-1">{ano}</span>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedJogador(jogador)} className="text-amber-400 hover:bg-slate-800 hover:text-amber-300">
                          Detalhes
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="border-slate-700 text-slate-300">‹</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button key={page} size="sm" variant={currentPage === page ? "default" : "outline"} onClick={() => setCurrentPage(page)} className={currentPage === page ? "bg-amber-600 hover:bg-amber-700" : "border-slate-700 text-slate-300"}>
                  {page}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="border-slate-700 text-slate-300">›</Button>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedJogador} onOpenChange={(open) => !open && setSelectedJogador(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-amber-400 text-2xl">{selectedJogador?.nome}</DialogTitle>
          </DialogHeader>
          {selectedJogador && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700 p-4 text-center cursor-pointer hover:border-amber-400 transition" onClick={() => handleCellEdit(selectedJogador.nome, 'total_jogos', String(selectedJogador.total_jogos))}>
                  {editingCell?.nome === selectedJogador.nome && editingCell?.field === 'total_jogos' ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-900 border border-amber-400 rounded text-amber-400 text-center text-2xl font-black"
                      autoFocus
                      onBlur={() => handleSaveEdit(selectedJogador.nome)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(selectedJogador.nome);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                  ) : (
                    <>
                      <div className="text-2xl font-black text-amber-400">{selectedJogador.total_jogos}</div>
                      <div className="text-xs text-slate-400 uppercase mt-2">Total de Jogos (clique para editar)</div>
                    </>
                  )}
                </Card>
                <Card className="bg-slate-800/50 border-slate-700 p-4 text-center cursor-pointer hover:border-red-400 transition" onClick={() => handleCellEdit(selectedJogador.nome, 'total_gols', String(selectedJogador.total_gols))}>
                  {editingCell?.nome === selectedJogador.nome && editingCell?.field === 'total_gols' ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-900 border border-red-400 rounded text-red-400 text-center text-2xl font-black"
                      autoFocus
                      onBlur={() => handleSaveEdit(selectedJogador.nome)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(selectedJogador.nome);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                  ) : (
                    <>
                      <div className="text-2xl font-black text-red-400">{selectedJogador.total_gols}</div>
                      <div className="text-xs text-slate-400 uppercase mt-2">Total de Gols (clique para editar)</div>
                    </>
                  )}
                </Card>
                <Card className="bg-slate-800/50 border-slate-700 p-4 text-center">
                  <div className="text-2xl font-black text-cyan-400">{selectedJogador.anos_atuou.length}</div>
                  <div className="text-xs text-slate-400 uppercase mt-2">Temporadas</div>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700 p-4 text-center">
                  <div className="text-2xl font-black text-amber-400">{selectedJogador.total_jogos > 0 ? (selectedJogador.total_gols / selectedJogador.total_jogos).toFixed(2) : "0.00"}</div>
                  <div className="text-xs text-slate-400 uppercase mt-2">Média Gols/Jogo (automática)</div>
                </Card>
              </div>

              <div>
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">Desempenho por Temporada</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-300">Ano</th>
                        <th className="px-4 py-2 text-center text-xs font-bold text-slate-300">Jogos</th>
                        <th className="px-4 py-2 text-center text-xs font-bold text-slate-300">Gols</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedJogador.anos_atuou.map(ano => (
                        <tr key={ano} className="border-b border-slate-800">
                          <td className="px-4 py-2 text-slate-300">{ano}</td>
                          <td className="px-4 py-2 text-center text-amber-400">{selectedJogador.jogos_por_ano[ano] || 0}</td>
                          <td className="px-4 py-2 text-center text-red-400">{selectedJogador.gols_por_ano[ano] || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-black/40 backdrop-blur-sm mt-12">
        <div className="container py-6 text-center text-xs text-slate-500">
          Dados coletados de <a href="https://www.meutimao.com.br" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">meutimao.com.br</a> · Temporadas 2015 a 2026 · Sport Club Corinthians Paulista
        </div>
      </footer>
    </div>
  );
}
