import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileDown, 
  FileJson, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  ArrowRight,
  Image as ImageIcon,
  MousePointer2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JsonData {
  [key: string]: any;
}

export default function App() {
  const [data, setData] = useState<JsonData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDataType = (items: JsonData[]) => {
    if (items.length === 0) return 'unknown';
    const first = items[0];
    if ('item_name' in first || 'item_price' in first) return 'catalog';
    if ('name' in first || 'prodspecH' in first || 'detail_list' in first) return 'detail';
    return 'custom';
  };

  const handleJsonParse = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        setData(parsed);
        setError(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('JSON 格式错误：必须是一个包含对象的数组。');
      }
    } catch (e) {
      setError('解析失败：请确保输入的是有效的 JSON 字符串。');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => handleJsonParse(event.target?.result as string);
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      const reader = new FileReader();
      reader.onload = (event) => handleJsonParse(event.target?.result as string);
      reader.readAsText(file);
    } else {
      setError('请上传有效的 .json 文件');
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) return;

    const keyMap: { [key: string]: string } = {
      'name': '商品名称',
      'item_name': '商品名称',
      'p_price': '价格',
      'item_price': '价格',
      'net_average_price': '平均净价',
      'prodspecH': '规格型号',
      'detail_list': '详细列表',
      'featureName': '尺寸特征',
      'text': '描述文本',
      'item_img href': '详情页链接',
      'img_box src': '图片预览'
    };

    const allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
    
    // Create the worksheet data
    const worksheetData = data.map(item => {
      const row: any = {};
      allKeys.forEach(key => {
        const k = key as string;
        const header = keyMap[k] || k;
        let value = (item as any)[k] || '';
        
        if (typeof value === 'string') {
          value = value.replace(/\\n/g, '\n');
          // Apply =IMAGE() formula for image links
          if (k === 'img_box src' && value.startsWith('http')) {
            // SheetJS requires a specific format for formulas
            row[header] = { t: 's', v: `=IMAGE("${value}")`, f: `IMAGE("${value}")` };
            return;
          }
        }
        row[header] = value;
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const timestamp = new Date().toLocaleDateString().replace(/\//g, '-');
    const type = getDataType(data) === 'catalog' ? '目录' : '详情';
    XLSX.writeFile(workbook, `数据导出_${type}_${timestamp}.xlsx`);
  };

  const dataType = getDataType(data);
  const previewKeys = data.length > 0 ? Object.keys(data[0]).slice(0, 6) : [];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[5%] w-[30%] h-[30%] bg-emerald-50 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Hero Section */}
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">智能数据转换引擎 v2.0</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4"
          >
            JSON <span className="text-indigo-600">转</span> Excel
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto"
          >
            专为商品数据设计的极简转换工具。支持自动识别格式、图片公式嵌入及动态列适配。
          </motion.p>
        </header>

        {/* Main Interaction Area */}
        <div className="grid grid-cols-1 gap-8">
          {data.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Step 1: Upload */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  group relative h-80 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer
                  flex flex-col items-center justify-center gap-6 p-8 bg-white/50 backdrop-blur-sm
                  ${isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200 hover:border-indigo-400 hover:bg-white shadow-sm hover:shadow-xl hover:shadow-indigo-500/5'}
                `}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json" className="hidden" />
                <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                  <Upload size={36} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-slate-800">导入 JSON 文件</h3>
                  <p className="text-slate-400 mt-2">点击或拖拽文件至此区域</p>
                </div>
              </div>

              {/* Step 2: Paste */}
              <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200 p-8 flex flex-col gap-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <FileJson size={20} />
                    </div>
                    <span className="font-semibold text-slate-800">粘贴 JSON 文本</span>
                  </div>
                </div>
                <textarea
                  placeholder='[{"name": "数据示例", ...}]'
                  className="flex-1 w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-300 font-mono text-sm resize-none min-h-[180px] transition-all"
                  onChange={(e) => e.target.value.trim() && handleJsonParse(e.target.value)}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold tracking-widest uppercase">
                    {dataType === 'catalog' ? '商品目录' : dataType === 'detail' ? '详情页' : '数据就绪'}
                  </div>
                  <h2 className="font-semibold text-slate-700">预览数据 ({data.length} 条)</h2>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setData([])} className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                    <Trash2 size={20} />
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all font-semibold shadow-lg shadow-indigo-200"
                  >
                    <Download size={18} />
                    <span>导出 Excel</span>
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      {previewKeys.map(key => (
                        <th key={key} className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.slice(0, 10).map((item, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                        {previewKeys.map(key => (
                          <td key={key} className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">
                            {String(item[key] || '-').replace(/\\n/g, ' ')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Feedback */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 shadow-sm"
              >
                <AlertCircle size={20} />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tutorial Section */}
        <section className="mt-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <Info size={20} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">使用指南 & 技巧</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Guide 1 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <MousePointer2 size={24} />
              </div>
              <h3 className="text-lg font-bold mb-3 text-slate-800">1. 导入数据</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                将抓取到的 JSON 数组文件直接拖入上方区域，或复制 JSON 文本粘贴。工具会自动解析字段并生成预览。
              </p>
            </div>

            {/* Guide 2 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <ImageIcon size={24} />
              </div>
              <h3 className="text-lg font-bold mb-3 text-slate-800">2. 图片公式说明</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                导出的 Excel 中，图片列使用了 <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">=IMAGE()</code> 公式。这能保持文件轻量且高清。
              </p>
            </div>

            {/* Guide 3 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                <FileDown size={24} />
              </div>
              <h3 className="text-lg font-bold mb-3 text-slate-800">3. 软件兼容性</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                请使用 <strong>Microsoft Excel 365</strong> 或 <strong>Excel 2021+</strong> 查看图片。若显示为文本，请确保单元格格式为“常规”并双击激活。
              </p>
            </div>
          </div>

          {/* Pro Tip Card */}
          <div className="mt-8 bg-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-200">
            <div className="flex items-center gap-6">
              <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md items-center justify-center shrink-0">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-1">提示：如何让 Excel 图片显示出来？</h4>
                <p className="text-indigo-100 text-sm max-w-xl">
                  打开导出的文件后，如果图片列显示为公式，请点击 Excel 顶部的“启用编辑”。现代版 Excel 会自动联网加载图片，无需手动下载。
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase backdrop-blur-md">
              <span>无需插件</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </section>

        <footer className="mt-24 text-center border-t border-slate-100 pt-8">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} 智能数据转换引擎. 隐私优先：所有处理均在本地浏览器完成。
          </p>
        </footer>
      </div>
    </div>
  );
}
