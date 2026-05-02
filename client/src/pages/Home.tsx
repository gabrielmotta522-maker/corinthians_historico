'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, Filter, RotateCcw, Plus } from "lucide-react";
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
  // Carregar dados do localStorage ou usar dados padrão
  const [jogadores, setJogadores] = useState<Jogador[]>(() => {
    if (typeof window !== 'undefined' && localStorage) {
      try {
        const saved = localStorage.getItem('corinthians_jogadores');
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('Dados carregados do localStorage:', parsed.length, 'jogadores');
          return parsed;
        }
      } catch (e) {
        console.error('Erro ao carregar dados do localStorage:', e);
      }
    }
    console.log('Usando dados padrão:', jogadoresData.length, 'jogadores');
    return jogadoresData;
  });
  const [filtrados, setFiltrados] = useState<Jogador[]>(jogadores);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAno, setFilterAno] = useState("");
  const [filterMinJogos, setFilterMinJogos] = useState("0");
  const [sortBy, setSortBy] = useState("total_jogos");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sortByMedia, setSortByMedia] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedJogador, setSelectedJogador] = useState<Jogador | null>(null);
  const [editingCell, setEditingCell] = useState<{ nome: string; field: 'total_jogos' | 'total_gols' } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJogador, setNewJogador] = useState({ nome: "", total_jogos: 0, total_gols: 0 });

  // Salvar dados no localStorage sempre que jogadores mudar
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage) {
      try {
        const dataToSave = JSON.stringify(jogadores);
        localStorage.setItem('corinthians_jogadores', dataToSave);
        console.log('✓ Dados salvos no localStorage:', jogadores.length, 'jogadores');
        
        // Verificar se foi salvo corretamente
        const verify = localStorage.getItem('corinthians_jogadores');
        if (verify) {
          console.log('✓ Verificação: dados foram salvos com sucesso');
        }
      } catch (e) {
        console.error('✗ Erro ao salvar no localStorage:', e);
      }
    }
  }, [jogadores]);

  // Salvar no localStorage quando a página está prestes a ser fechada
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined' && localStorage) {
        try {
          localStorage.setItem('corinthians_jogadores', JSON.stringify(jogadores));
          console.log('✓ Dados salvos antes de deslogar');
        } catch (e) {
          console.error('Erro ao salvar antes de deslogar:', e);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [jogadores]);

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
      let aVal: any;
      let bVal: any;

      if (sortByMedia) {
        // Ordenar por média de gols/jogo
        aVal = a.total_jogos > 0 ? a.total_gols / a.total_jogos : 0;
        bVal = b.total_jogos > 0 ? b.total_gols / b.total_jogos : 0;
      } else {
        aVal = a[sortBy as keyof Jogador];
        bVal = b[sortBy as keyof Jogador];

        if (sortBy === "total_jogos" || sortBy === "total_gols") {
          aVal = aVal as number;
          bVal = bVal as number;
        }
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "desc" ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });

    setFiltrados(result);
    setCurrentPage(1);
  }, [jogadores, searchTerm, filterAno, filterMinJogos, sortBy, sortDir, sortByMedia]);

  const handleSort = (field: string) => {
    setSortByMedia(false);
    if (sortBy === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const handleClear = () => {
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
    console.log('Editando:', jogadorNome, editingCell.field, 'novo valor:', newValue);
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
    
    console.log('Jogadores atualizados:', updatedJogadores.find(j => j.nome === jogadorNome));
    setJogadores(updatedJogadores);
    setEditingCell(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleAddJogador = () => {
    if (!newJogador.nome.trim()) {
      alert("Por favor, insira o nome do jogador");
      return;
    }

    const novoJogador: Jogador = {
      nome: newJogador.nome.trim(),
      total_jogos: newJogador.total_jogos,
      total_gols: newJogador.total_gols,
      jogos_por_ano: {},
      gols_por_ano: {},
      anos_atuou: [],
    };

    setJogadores([...jogadores, novoJogador]);
    setNewJogador({ nome: "", total_jogos: 0, total_gols: 0 });
    setShowAddModal(false);
  };

  const totalJogos = jogadores.reduce((sum, j) => sum + j.total_jogos, 0);
  const totalGols = jogadores.reduce((sum, j) => sum + j.total_gols, 0);
  const totalPages = Math.ceil(filtrados.length / itemsPerPage);
  const paginatedJogadores = filtrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const top10Jogos = [...jogadores].sort((a, b) => b.total_jogos - a.total_jogos).slice(0, 10);
  const top10Gols = [...jogadores].sort((a, b) => b.total_gols - a.total_gols).slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="container py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center font-bold text-slate-900 text-lg">SC</div>
            <div>
              <h1 className="text-3xl font-black text-amber-400">HISTÓRICO CORINTHIANS</h1>
              <p className="text-sm text-slate-400">Jogadores que vestiram a camisa — 2015 a 2026 · Fonte: meutimao.com.br</p>
            </div>
            <div className="ml-auto text-right">
              <span className="text-xs text-slate-500 uppercase">Período</span>
              <div className="text-amber-400 font-bold text-lg">2015–2026</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card className="bg-slate-800/50 border-slate-700 p-3 text-center">
              <div className="text-2xl font-black text-amber-400">{jogadores.length}</div>
              <div className="text-xs text-slate-400 uppercase">Jogadores Únicos</div>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 p-3 text-center">
              <div className="text-2xl font-black text-amber-400">{totalJogos.toLocaleString()}</div>
              <div className="text-xs text-slate-400 uppercase">Total de Jogos</div>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 p-3 text-center">
              <div className="text-2xl font-black text-red-400">{totalGols.toLocaleString()}</div>
              <div className="text-xs text-slate-400 uppercase">Total de Gols</div>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 p-3 text-center">
              <div className="text-2xl font-black text-cyan-400">12</div>
              <div className="text-xs text-slate-400 uppercase">Temporadas</div>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 p-3 text-center">
              <div className="text-sm text-slate-300">{top10Jogos[0]?.nome}</div>
              <div className="text-amber-400 font-bold">Mais jogos: {top10Jogos[0]?.total_jogos}</div>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 p-3 text-center">
              <div className="text-sm text-slate-300">{top10Gols[0]?.nome}</div>
              <div className="text-red-400 font-bold">Mais gols: {top10Gols[0]?.total_gols}</div>
            </Card>
          </div>
        </div>
      </header>

      {/* Charts */}
      <section className="container py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-slate-800/30 border-slate-700 p-6">
            <h3 className="text-amber-400 font-bold uppercase text-sm mb-4">Top 10 — Total de Jogos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10Jogos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nome" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                <Bar dataKey="total_jogos" fill="#fbbf24" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700 p-6">
            <h3 className="text-amber-400 font-bold uppercase text-sm mb-4">Top 10 — Total de Gols</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top10Gols}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nome" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                <Bar dataKey="total_gols" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <section className="container pb-8">
        <Card className="bg-slate-800/30 border-slate-700 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-slate-700 flex flex-wrap gap-3 items-center">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar jogador..."
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
              </SelectContent>
            </Select>

            <Button onClick={handleClear} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>

            <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Jogador
            </Button>

            <Button onClick={handleExportCSV} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          <div className="text-sm text-slate-400 px-4 pt-4">
            {filtrados.length} jogador(es) encontrado(s)
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="px-4 py-3 text-left font-bold text-slate-300">#</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-300">JOGADOR</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-300 cursor-pointer hover:text-amber-400" onClick={() => handleSort("total_jogos")}>
                    JOGOS {sortBy === "total_jogos" && (sortDir === "desc" ? "▼" : "▲")}
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-slate-300 cursor-pointer hover:text-red-400" onClick={() => handleSort("total_gols")}>
                    GOLS {sortBy === "total_gols" && (sortDir === "desc" ? "▼" : "▲")}
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-slate-300 cursor-pointer hover:text-cyan-400" onClick={() => {
                    if (sortByMedia) {
                      setSortDir(sortDir === "desc" ? "asc" : "desc");
                    } else {
                      setSortByMedia(true);
                      setSortDir("desc");
                    }
                  }}>
                    MÉDIA GOLS/JOGO {sortByMedia && (sortDir === "desc" ? "▼" : "▲")}
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-slate-300">TEMPORADAS</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-300">ANOS</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-300">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {paginatedJogadores.map((jogador, idx) => {
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
                      <td className="px-4 py-3 text-center text-slate-400">{jogador.anos_atuou.length}</td>
                      <td className="px-4 py-3 text-center text-slate-400 text-xs">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {jogador.anos_atuou.map(ano => (
                            <span key={ano} className="bg-slate-700 px-2 py-1 rounded">{ano}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" onClick={() => setSelectedJogador(jogador)} className="bg-slate-700 hover:bg-slate-600 text-slate-100">
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
      </section>

      {/* Modal de Adição de Jogador */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Adicionar Novo Jogador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 block mb-2">Nome do Jogador</label>
              <Input
                value={newJogador.nome}
                onChange={(e) => setNewJogador({ ...newJogador, nome: e.target.value })}
                placeholder="Ex: João Silva"
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 block mb-2">Total de Jogos</label>
                <Input
                  type="number"
                  value={newJogador.total_jogos}
                  onChange={(e) => setNewJogador({ ...newJogador, total_jogos: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 block mb-2">Total de Gols</label>
                <Input
                  type="number"
                  value={newJogador.total_gols}
                  onChange={(e) => setNewJogador({ ...newJogador, total_gols: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded p-3">
              <p className="text-sm text-slate-300">Média de Gols/Jogo:</p>
              <p className="text-2xl font-bold text-cyan-400">
                {newJogador.total_jogos > 0 ? (newJogador.total_gols / newJogador.total_jogos).toFixed(2) : "0.00"}
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowAddModal(false)} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Cancelar
              </Button>
              <Button onClick={handleAddJogador} className="bg-green-600 hover:bg-green-700 text-white font-bold">
                Adicionar Jogador
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-4 mt-8">
        <div className="container text-center text-sm text-slate-500">
          <a href="https://www.meutimao.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">
            meutimao.com.br
          </a>
        </div>
      </footer>
    </div>
  );
}
