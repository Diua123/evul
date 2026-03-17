
import { Language } from '../types';

const translations = {
  [Language.PT]: {
    welcome: "Bem-vindo à EV-UL",
    login: "Entrar",
    register: "Cadastrar",
    logout: "Sair",
    home: "Início",
    settings: "Definições",
    about: "Sobre nós",
    chat: "Chat",
    posts: "Publicações",
    library: "Biblioteca",
    communities: "Comunidades",
    gallery: "Galeria de Arte",
    language: "Idioma",
    theme: "Tema",
    profile: "Perfil",
    security: "Segurança",
    notifications: "Notificações",
    preferences: "Preferências",
    search: "Pesquisar...",
    publish: "Publicar",
    academic_materials: "Materiais Académicos",
    scientific_works: "Trabalhos Científicos",
    monographs: "Monografias",
    analytical_plans: "Planos Analíticos",
    schedules: "Horários",
    statistics: "Estatísticas do Curso",
    leadership: "Corpo Directivo",
    students: "Estudantes",
    professors: "Docentes",
    contact: "Contactos",
    edit_profile: "Editar Perfil",
    save: "Guardar",
    cancel: "Cancelar",
    full_name: "Nome Completo",
    student_number: "Número de Estudante",
    year: "Ano de Frequência",
    change_photo: "Alterar Foto",
    success_update: "Perfil atualizado com sucesso!",
    add_file: "Adicionar Ficheiro",
    file_title: "Título do Ficheiro",
    author_name: "Nome do Autor",
    file_description: "Descrição",
    select_file: "Selecionar Ficheiro",
    upload: "Carregar",
    view: "Visualizar",
    download: "Descarregar",
    no_files: "Nenhum ficheiro encontrado nesta categoria."
  }
};

export const t = (key: keyof typeof translations[Language.PT], lang: Language): string => {
  return translations[lang][key] || key;
};
