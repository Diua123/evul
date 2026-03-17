
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { getUsersFB, createUserFB } from '../services/firebaseService';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [userType, setUserType] = useState<UserRole>('student');
  const [isRegister, setIsRegister] = useState(false);
  
  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({ 
    name: '', 
    number: '', 
    password: '', 
    confirmPassword: '', 
    photo: '',
    accessCode: '',
    selectedYear: '1'
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatStudentNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.substring(0, 2)}.${digits.substring(2)}`;
    if (digits.length > 6) formatted = `${digits.substring(0, 2)}.${digits.substring(2, 6)}.${digits.substring(6, 10)}`;
    return formatted.substring(0, 12);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setFormData({ ...formData, photo: event.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const calculateYearFromNumber = (number: string): number => {
    const parts = number.split('.');
    if (parts.length < 3) return 1;
    const yearSuffix = parseInt(parts[2]);
    return isNaN(yearSuffix) ? 1 : Math.max(1, 2027 - yearSuffix);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const users = await getUsersFB();

      // ==========================================
      // LÓGICA DE ESTUDANTE
      // ==========================================
      if (userType === 'student') {
        if (isRegister) {
          if (!formData.name.trim()) { setError('Nome é obrigatório'); setLoading(false); return; }
          if (formData.password !== formData.confirmPassword) { setError('Senhas não coincidem'); setLoading(false); return; }
          
          const existing = users.find(u => u.Number === formData.number);
          if (existing) { setError('Número já registado'); setLoading(false); return; }

          const newUser: User = {
            id: 's_' + Math.random().toString(36).substr(2, 9),
            name: formData.name,
            Number: formData.number,
            photo: formData.photo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            anoFrequencia: calculateYearFromNumber(formData.number),
            role: 'student'
          };
          
          const docRef = await createUserFB(newUser);
          const userWithId = { ...newUser, id: docRef.id };
          storage.setCurrentUserId(docRef.id);
          storage.setCachedUser(userWithId);
        } else {
          const user = users.find(u => u.Number === formData.number);
          if (!user) { setError('Usuário não encontrado. Cadastre-se primeiro.'); setLoading(false); return; }
          storage.setCurrentUserId(user.id);
          storage.setCachedUser(user);
        }
      } 
      // ==========================================
      // LÓGICA DE CHEFE E DOCENTE
      // ==========================================
      else {
        // --- CADASTRO ---
        if (isRegister) {
          if (!formData.name.trim()) { setError('Nome é obrigatório'); setLoading(false); return; }
          
          // Validação Código Chefe: Chefe1, Chefe2, Chefe3, Chefe4
          if (userType === 'chefe') {
              const expectedCode = `Chefe${formData.selectedYear}`;
              if (formData.accessCode !== expectedCode) {
                  setError(`Código inválido para o ${formData.selectedYear}º Ano.`);
                  setLoading(false); 
                  return;
              }
              // Verificar se já existe chefe para este ano
              const existingChefe = users.find(u => u.role === 'chefe' && u.anoFrequencia === parseInt(formData.selectedYear));
              if (existingChefe) {
                  setError(`Já existe um Chefe registado para o ${formData.selectedYear}º Ano.`);
                  setLoading(false);
                  return;
              }
          }

          // Validação Código Docente: @PrimeiroNome
          if (userType === 'docente') {
              const firstName = formData.name.trim().split(' ')[0];
              const expectedCode = `@${firstName}`;
              if (formData.accessCode !== expectedCode) {
                  setError(`Código inválido.`);
                  setLoading(false);
                  return;
              }
          }

          const newUser: User = {
            id: 's_' + Math.random().toString(36).substr(2, 9),
            name: formData.name,
            photo: formData.photo || (userType === 'docente' ? 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png' : 'https://cdn-icons-png.flaticon.com/512/3135/3135823.png'),
            anoFrequencia: userType === 'chefe' ? parseInt(formData.selectedYear) : 0,
            role: userType
          };
          
          const docRef = await createUserFB(newUser);
          const userWithId = { ...newUser, id: docRef.id };
          storage.setCurrentUserId(docRef.id);
          storage.setCachedUser(userWithId);

        } 
        // --- LOGIN (APENAS CÓDIGO) ---
        else {
          const code = formData.accessCode.trim();
          let user: User | undefined;

          if (userType === 'chefe') {
              if (!code.startsWith('Chefe')) { setError('Formato de código inválido.'); setLoading(false); return; }
              const yearStr = code.replace('Chefe', '');
              const year = parseInt(yearStr);
              if (isNaN(year)) { setError('Código inválido.'); setLoading(false); return; }
              user = users.find(u => u.role === 'chefe' && u.anoFrequencia === year);
          } 
          else if (userType === 'docente') {
              if (!code.startsWith('@')) { setError('Formato de código inválido.'); setLoading(false); return; }
              const namePart = code.substring(1).toLowerCase();
              // Procura por um docente cujo nome contenha a parte digitada (ex: @Samuel ou @SamuelPhuelle)
              user = users.find(u => u.role === 'docente' && u.name.toLowerCase().replace('dr. ', '').replace('dra. ', '').includes(namePart));
          }

          if (!user) {
              setError('Usuário não encontrado ou código incorreto. Cadastre-se primeiro.');
              setLoading(false);
              return;
          }

          storage.setCurrentUserId(user.id);
          storage.setCachedUser(user);
        }
      }

      setTimeout(() => { onLogin(); navigate('/'); }, 800);
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique sua conexão.');
      setLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch(role) {
      case 'docente': return 'fa-chalkboard-teacher';
      case 'chefe': return 'fa-user-tie';
      default: return 'fa-user-graduate';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case 'docente': return 'Docente';
      case 'chefe': return 'Chefe de Turma';
      default: return 'Estudante';
    }
  };

  return (
    <div className="min-h-screen bg-ev-blue flex items-center justify-center p-4">
      <div className="w-full bg-white dark:bg-gray-800 rounded-5xl shadow-2xl overflow-hidden animate-fadeIn">
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl border-4 border-ev-brown overflow-hidden">
            <i className={`fas ${getRoleIcon(userType)} text-ev-blue text-3xl`}></i>
          </div>
          <h1 className="text-xl font-black text-ev-blue uppercase tracking-widest">
            {isRegister ? `Novo ${getRoleLabel(userType)}` : `Acesso ${getRoleLabel(userType)}`}
          </h1>
          <p className="text-gray-400 text-[10px] mt-1 font-black uppercase tracking-[0.3em]">Plataforma EV-UL</p>
        </div>

        {/* Abas de Tipo de Usuário */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          {(['student', 'chefe', 'docente'] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => { setUserType(role); setError(''); setIsRegister(false); setFormData({...formData, name: '', accessCode: '', number: '', password: ''}); }}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                userType === role 
                ? 'bg-white dark:bg-gray-800 text-ev-blue border-b-2 border-ev-blue' 
                : 'bg-gray-50 dark:bg-gray-900 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {getRoleLabel(role)}
            </button>
          ))}
        </div>

        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="bg-red-50 text-red-500 p-4 rounded-3xl text-xs font-bold text-center border border-red-100 animate-bounce">{error}</div>}
            
            {/* Foto apenas no Cadastro */}
            {isRegister && (
              <div className="flex flex-col items-center gap-3 mb-6">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-ev-blue shadow-inner bg-gray-50 flex items-center justify-center group">
                  {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" alt="" /> : <i className="fas fa-camera text-gray-300 text-2xl group-hover:text-ev-blue transition-colors"></i>}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Foto (Opcional)</span>
              </div>
            )}

            {/* --- ESTUDANTE --- */}
            {userType === 'student' && (
              <>
                 {isRegister && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Nome Completo</label>
                    <input type="text" required className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-ev-blue shadow-inner" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Número de Estudante</label>
                  <input type="text" required className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-ev-blue shadow-inner" value={formData.number} onChange={(e) => setFormData({ ...formData, number: formatStudentNumber(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Senha</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-ev-blue shadow-inner pr-12" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ev-blue">
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                {isRegister && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Confirmar Senha</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} required className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-ev-blue shadow-inner pr-12" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ev-blue">
                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* --- CHEFE E DOCENTE --- */}
            {userType !== 'student' && (
              <>
                {/* Campos visíveis APENAS no Cadastro */}
                {isRegister && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Nome Completo</label>
                      <input type="text" required className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-ev-blue shadow-inner" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    {userType === 'chefe' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Ano da Turma</label>
                        <select 
                          className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-ev-blue shadow-inner"
                          value={formData.selectedYear}
                          onChange={(e) => setFormData({...formData, selectedYear: e.target.value})}
                        >
                          <option value="1">1º Ano</option>
                          <option value="2">2º Ano</option>
                          <option value="3">3º Ano</option>
                          <option value="4">4º Ano</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Campo de Código (Visível no Cadastro e Login) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">Código de Acesso</label>
                  <div className="relative">
                    <input 
                      type={showAccessCode ? "text" : "password"} 
                      required 
                      className="w-full p-4 rounded-3xl border-none bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-ev-blue shadow-inner pr-12" 
                      value={formData.accessCode} 
                      onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })} 
                    />
                    <button type="button" onClick={() => setShowAccessCode(!showAccessCode)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ev-blue">
                      <i className={`fas ${showAccessCode ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {/* Removido o texto que indica a chave de acesso */}
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="w-full bg-ev-brown text-white py-5 rounded-3xl font-black shadow-xl hover:bg-[#5a331a] transition-all uppercase tracking-widest flex items-center justify-center gap-3 mt-4 active:scale-95">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRegister ? 'Cadastrar' : 'Entrar')}
            </button>
          </form>

          {/* Botão de Alternância Login/Cadastro (Para TODOS) */}
          <div className="mt-8 flex flex-col gap-4 text-center">
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-ev-blue text-xs font-black uppercase tracking-widest hover:underline">
                {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-gray-400 hover:text-ev-blue transition-colors text-[10px] font-black uppercase tracking-widest"><i className="fas fa-eye mr-2"></i> Visitar como Convidado</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
