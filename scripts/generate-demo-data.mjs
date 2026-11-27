// Génère src/data/demo-needs.json : 32 besoins FICTIFS et leurs volumes quotidiens par pays.
// La graine est fixe : relancer le script produit exactement le même fichier.
// Pour brancher une vraie source plus tard, il suffit de produire un fichier au même format
// (voir src/data/types.ts) ou de remplacer src/data/source.ts.
import { writeFileSync } from 'node:fs';

const DAYS = 180; // 2 × 90 jours : permet de comparer chaque période à la précédente.
const END_DATE = '2026-11-26'; // dernier jour couvert par la démo

// Pays : [volume quotidien de départ, facteur de croissance sur 180 jours, pic récent (0 = aucun)]
// Critères (0-100) : pain = douleur, weakComp = faiblesse de la concurrence, pay = disposition à payer, feas = faisabilité.
const NEEDS = [
  // ───────── Technologie
  {
    id: 'resume-reunions', category: 'technologie', title: 'Résumer les réunions en liste d’actions',
    summary: 'Transformer un enregistrement de réunion en décisions, tâches et responsables, sans relire la transcription.',
    keywords: ['réunion', 'compte rendu', 'transcription', 'tâches'],
    criteria: { pain: 72, weakComp: 38, pay: 74, feas: 80 },
    countries: { FRA: [62, 1.9, 0], USA: [140, 1.6, 0], JPN: [48, 2.2, 0], IND: [55, 2.4, 0.3] },
    messages: [
      { country: 'FRA', text: 'Chaque lundi je passe une heure à relire mes notes pour retrouver qui doit faire quoi. Il existe un outil qui sort juste la liste des actions ?' },
      { country: 'JPN', text: 'Les transcriptions automatiques sont trop longues. J’ai besoin des décisions, pas de tout le texte.' },
      { country: 'USA', text: 'Toute l’équipe enregistre ses appels, mais personne ne lit les transcriptions. Il nous faut les actions directement dans notre outil de tâches.' },
    ],
    solutions: [
      { name: 'Assistants de visioconférence intégrés', limit: 'Liés à un seul logiciel de visio, résumés génériques.' },
      { name: 'Outils de transcription', limit: 'Produisent du texte brut, sans attribution des tâches.' },
    ],
  },
  {
    id: 'mots-de-passe-famille', category: 'technologie', title: 'Gérer les mots de passe de toute la famille',
    summary: 'Partager et sécuriser les accès (banque, streaming, école) entre parents et enfants, sans complexité.',
    keywords: ['mot de passe', 'sécurité', 'famille', 'partage'],
    criteria: { pain: 58, weakComp: 30, pay: 52, feas: 70 },
    countries: { FRA: [30, 1.2, 0], USA: [70, 1.1, 0], BRA: [26, 1.4, 0] },
    messages: [
      { country: 'FRA', text: 'Ma mère m’appelle chaque semaine parce qu’elle a perdu un mot de passe. Je cherche un truc simple qu’elle saura utiliser.' },
      { country: 'BRA', text: 'On partage les comptes de streaming en famille et c’est le chaos à chaque changement de mot de passe.' },
    ],
    solutions: [
      { name: 'Gestionnaires de mots de passe grand public', limit: 'Jugés trop techniques pour les seniors.' },
      { name: 'Trousseau du navigateur', limit: 'Partage familial limité ou inexistant.' },
    ],
  },
  {
    id: 'reponses-clients-tpe', category: 'technologie', title: 'Automatiser les réponses clients d’une petite entreprise',
    summary: 'Répondre aux questions répétitives (horaires, devis, suivi de commande) par messagerie et e-mail, sans service client dédié.',
    keywords: ['service client', 'chatbot', 'TPE', 'messagerie', 'automatisation'],
    criteria: { pain: 76, weakComp: 52, pay: 80, feas: 66 },
    countries: { FRA: [44, 2.1, 0], BRA: [72, 2.6, 0.25], IND: [90, 2.3, 0], USA: [60, 1.5, 0] },
    messages: [
      { country: 'BRA', text: 'Je reçois 200 messages par jour sur ma messagerie pro, 80 % sont la même question sur les délais de livraison.' },
      { country: 'FRA', text: 'Artisan, je perds mes soirées à répondre aux demandes de devis. Je voudrais un premier tri automatique.' },
      { country: 'IND', text: 'Les outils de chatbot sont faits pour les grandes entreprises, trop chers et trop compliqués pour ma boutique.' },
    ],
    solutions: [
      { name: 'Plateformes de chatbot pour grandes entreprises', limit: 'Prix et paramétrage hors de portée d’une TPE.' },
      { name: 'Réponses rapides des messageries pro', limit: 'Modèles figés, aucune compréhension de la question.' },
    ],
  },
  {
    id: 'trier-photos', category: 'technologie', title: 'Sauvegarder et trier ses photos sans abonnement',
    summary: 'Regrouper les photos de plusieurs téléphones, supprimer les doublons et les garder en sécurité sans payer chaque mois.',
    keywords: ['photos', 'sauvegarde', 'doublons', 'stockage'],
    criteria: { pain: 55, weakComp: 34, pay: 46, feas: 72 },
    countries: { FRA: [38, 1.1, 0], USA: [64, 1.0, 0], JPN: [40, 1.2, 0], BRA: [30, 1.3, 0] },
    messages: [
      { country: 'JPN', text: '40 000 photos sur trois téléphones, dont la moitié en double. Je veux un tri automatique, une seule fois.' },
      { country: 'FRA', text: 'Marre de payer un stockage en ligne tous les mois juste pour garder les photos des enfants.' },
    ],
    solutions: [
      { name: 'Stockage photo en ligne des grands éditeurs', limit: 'Abonnement mensuel, dépendance à un écosystème.' },
      { name: 'Logiciels de dédoublonnage', limit: 'Interfaces vieillissantes, pas de tri intelligent.' },
    ],
  },
  // ───────── Économie
  {
    id: 'relance-factures', category: 'economie', title: 'Relancer automatiquement les factures impayées',
    summary: 'Pour les indépendants : relances polies et progressives, suivi des retards et rappel des pénalités, sans gêner la relation client.',
    keywords: ['facture', 'impayé', 'relance', 'freelance', 'indépendant'],
    criteria: { pain: 82, weakComp: 48, pay: 78, feas: 82 },
    countries: { FRA: [58, 1.7, 0], USA: [70, 1.3, 0], BRA: [36, 1.9, 0], IND: [42, 2.0, 0] },
    messages: [
      { country: 'FRA', text: 'Trois clients me doivent 6 000 € depuis deux mois. Relancer me met mal à l’aise, j’aimerais que ce soit automatique.' },
      { country: 'IND', text: 'Le logiciel de facturation envoie la facture, mais rien ne se passe ensuite si le client ne paie pas.' },
    ],
    solutions: [
      { name: 'Logiciels de facturation en ligne', limit: 'Relances basiques, peu personnalisables.' },
      { name: 'Sociétés de recouvrement', limit: 'Coûteuses et brutales pour la relation client.' },
    ],
  },
  {
    id: 'budget-couple', category: 'economie', title: 'Partager un budget de couple sans tableur',
    summary: 'Répartir les dépenses communes au prorata des revenus et voir qui doit quoi, sans fusionner les comptes.',
    keywords: ['budget', 'couple', 'dépenses', 'partage'],
    criteria: { pain: 60, weakComp: 44, pay: 48, feas: 84 },
    countries: { FRA: [40, 1.4, 0], USA: [52, 1.2, 0], JPN: [22, 1.5, 0] },
    messages: [
      { country: 'FRA', text: 'On gagne pas pareil, on veut payer au prorata. Notre tableur partagé finit toujours faux.' },
      { country: 'USA', text: 'Les applis de partage de dépenses sont faites pour les colocs, pas pour un couple sur le long terme.' },
    ],
    solutions: [
      { name: 'Applications de partage de dépenses entre amis', limit: 'Pas de prorata, pas de vision mensuelle.' },
      { name: 'Comptes joints bancaires', limit: 'Imposent de mettre tout en commun.' },
    ],
  },
  {
    id: 'abonnements-oublies', category: 'economie', title: 'Repérer et résilier les abonnements oubliés',
    summary: 'Lister tous les prélèvements récurrents, alerter avant les renouvellements et guider la résiliation.',
    keywords: ['abonnement', 'résiliation', 'prélèvement', 'économies'],
    criteria: { pain: 66, weakComp: 36, pay: 55, feas: 70 },
    countries: { FRA: [50, 1.5, 0], USA: [96, 1.3, 0], BRA: [34, 1.6, 0], JPN: [28, 1.3, 0] },
    messages: [
      { country: 'USA', text: 'J’ai découvert que je payais encore une appli de sport depuis 14 mois. Comment éviter ça ?' },
      { country: 'FRA', text: 'Chaque résiliation est un parcours du combattant différent. Je voudrais un seul endroit pour tout gérer.' },
    ],
    solutions: [
      { name: 'Applications bancaires', limit: 'Détectent les prélèvements mais n’aident pas à résilier.' },
      { name: 'Services de résiliation par courrier', limit: 'Payants à l’unité, lents.' },
    ],
  },
  {
    id: 'prix-occasion', category: 'economie', title: 'Estimer le juste prix d’un objet d’occasion',
    summary: 'Savoir à quel prix vendre ou acheter un objet d’occasion à partir de son état et des ventes récentes.',
    keywords: ['occasion', 'prix', 'revente', 'estimation'],
    criteria: { pain: 48, weakComp: 40, pay: 30, feas: 64 },
    countries: { FRA: [46, 1.2, 0], BRA: [40, 1.4, 0], JPN: [36, 1.1, 0] },
    messages: [
      { country: 'FRA', text: 'Je ne sais jamais à combien mettre mes annonces : soit ça part en 5 minutes, soit jamais.' },
      { country: 'BRA', text: 'Pour un vélo d’occasion, les prix vont du simple au triple. Il manque une cote fiable.' },
    ],
    solutions: [
      { name: 'Sites de petites annonces', limit: 'Aucune estimation, comparaison manuelle.' },
      { name: 'Cotes spécialisées (auto, high-tech)', limit: 'Limitées à quelques catégories d’objets.' },
    ],
  },
  // ───────── Santé
  {
    id: 'rdv-medical-rapide', category: 'sante', title: 'Trouver un rendez-vous médical rapide',
    summary: 'Obtenir un créneau sous 48 h chez un généraliste ou un spécialiste, avec alerte quand une place se libère.',
    keywords: ['médecin', 'rendez-vous', 'spécialiste', 'désistement'],
    criteria: { pain: 90, weakComp: 26, pay: 50, feas: 48 },
    countries: { FRA: [120, 1.5, 0.2], BRA: [70, 1.3, 0], IND: [80, 1.4, 0] },
    messages: [
      { country: 'FRA', text: 'Dermatologue : premier rendez-vous dans 7 mois. Je rafraîchis la page tous les soirs pour les désistements.' },
      { country: 'IND', text: 'Trouver un spécialiste disponible cette semaine relève de la chance. Il faudrait être prévenu des annulations.' },
    ],
    solutions: [
      { name: 'Plateformes de prise de rendez-vous', limit: 'Pas d’alerte fiable sur les désistements.' },
      { name: 'Téléconsultation', limit: 'Ne remplace pas un examen chez certains spécialistes.' },
    ],
  },
  {
    id: 'medicaments-parent', category: 'sante', title: 'Suivre la prise de médicaments d’un parent âgé',
    summary: 'Rappels de prise, confirmation à distance pour les proches et alerte en cas d’oubli.',
    keywords: ['médicaments', 'seniors', 'aidant', 'rappel'],
    criteria: { pain: 80, weakComp: 50, pay: 70, feas: 72 },
    countries: { FRA: [42, 1.6, 0], JPN: [64, 1.8, 0], USA: [50, 1.3, 0] },
    messages: [
      { country: 'JPN', text: 'Mon père vit seul à 300 km. Je n’ai aucun moyen de savoir s’il a pris son traitement du soir.' },
      { country: 'FRA', text: 'Les piluliers connectés sont chers et ma mère ne veut pas d’un nouvel appareil compliqué.' },
    ],
    solutions: [
      { name: 'Piluliers connectés', limit: 'Matériel coûteux, installation difficile.' },
      { name: 'Applications de rappel', limit: 'Aucun retour pour l’aidant à distance.' },
    ],
  },
  {
    id: 'comprendre-sommeil', category: 'sante', title: 'Comprendre ses troubles du sommeil',
    summary: 'Identifier les causes de ses réveils nocturnes avec un suivi simple, sans montre connectée.',
    keywords: ['sommeil', 'insomnie', 'fatigue', 'suivi'],
    criteria: { pain: 64, weakComp: 28, pay: 44, feas: 68 },
    countries: { FRA: [36, 1.1, 0], USA: [80, 1.0, 0], JPN: [52, 1.2, 0], BRA: [28, 1.1, 0] },
    messages: [
      { country: 'USA', text: 'Je me réveille à 3 h chaque nuit. Les applis me donnent un score mais jamais d’explication.' },
      { country: 'JPN', text: 'Je ne veux pas dormir avec une montre. Il existe une méthode simple pour comprendre ce qui ne va pas ?' },
    ],
    solutions: [
      { name: 'Montres et bagues connectées', limit: 'Matériel requis, données difficiles à interpréter.' },
      { name: 'Applications de méditation', limit: 'Ne cherchent pas les causes.' },
    ],
  },
  {
    id: 'soutien-psy-abordable', category: 'sante', title: 'Accéder à un soutien psychologique abordable',
    summary: 'Trouver rapidement un professionnel adapté à son budget et à sa situation, en ligne ou près de chez soi.',
    keywords: ['psychologue', 'santé mentale', 'thérapie', 'prix'],
    criteria: { pain: 86, weakComp: 32, pay: 58, feas: 50 },
    countries: { FRA: [54, 1.3, 0], USA: [110, 1.2, 0], BRA: [46, 1.5, 0], IND: [40, 1.7, 0] },
    messages: [
      { country: 'BRA', text: 'Je ne sais pas par où commencer : psychologue, psychiatre, thérapie en ligne ? Et à quel prix ?' },
      { country: 'FRA', text: 'Les séances remboursées sont complètes partout près de chez moi.' },
    ],
    solutions: [
      { name: 'Plateformes de thérapie en ligne', limit: 'Abonnements élevés, choix du thérapeute limité.' },
      { name: 'Annuaires professionnels', limit: 'Pas de filtre par disponibilité ni par budget.' },
    ],
  },
  // ───────── Sport
  {
    id: 'muscu-maison', category: 'sport', title: 'Programme de musculation selon son matériel',
    summary: 'Un programme qui s’adapte au matériel réellement disponible à la maison et progresse semaine après semaine.',
    keywords: ['musculation', 'maison', 'programme', 'entraînement'],
    criteria: { pain: 46, weakComp: 22, pay: 50, feas: 86 },
    countries: { FRA: [48, 1.1, 0], USA: [90, 1.0, 0], BRA: [60, 1.2, 0], IND: [44, 1.4, 0] },
    messages: [
      { country: 'BRA', text: 'J’ai deux haltères et un élastique. Tous les programmes demandent une salle complète.' },
      { country: 'FRA', text: 'Je stagne depuis des mois, je voudrais un programme qui augmente les charges à ma place.' },
    ],
    solutions: [
      { name: 'Applications de fitness', limit: 'Programmes génériques, peu adaptés au matériel.' },
      { name: 'Vidéos en ligne gratuites', limit: 'Aucune progression ni suivi.' },
    ],
  },
  {
    id: 'partenaires-sport', category: 'sport', title: 'Trouver des partenaires de sport près de chez soi',
    summary: 'Compléter une équipe ou trouver un partenaire de même niveau pour un sport collectif ou de raquette.',
    keywords: ['partenaire', 'équipe', 'foot', 'padel', 'tennis'],
    criteria: { pain: 52, weakComp: 46, pay: 32, feas: 74 },
    countries: { FRA: [56, 1.8, 0.35], BRA: [84, 1.5, 0], USA: [40, 1.2, 0] },
    messages: [
      { country: 'FRA', text: 'On est trois pour le padel, il en manque toujours un. Les groupes de messagerie ne suffisent plus.' },
      { country: 'BRA', text: 'Il faudrait une appli pour trouver un match de foot ce soir avec des gens du même niveau.' },
    ],
    solutions: [
      { name: 'Applications de réservation de terrains', limit: 'Réservent un terrain, ne trouvent pas les joueurs.' },
      { name: 'Groupes sur les réseaux sociaux', limit: 'Désorganisés, aucun filtre de niveau.' },
    ],
  },
  {
    id: 'reprise-blessure', category: 'sport', title: 'Reprendre le sport après une blessure',
    summary: 'Un plan de reprise progressif et sûr, validé par un kinésithérapeute, entre la fin des soins et l’entraînement normal.',
    keywords: ['blessure', 'reprise', 'kiné', 'rééducation'],
    criteria: { pain: 70, weakComp: 62, pay: 64, feas: 58 },
    countries: { FRA: [26, 1.5, 0], USA: [44, 1.4, 0], JPN: [18, 1.3, 0] },
    messages: [
      { country: 'USA', text: 'Mes séances de kiné sont terminées mais je ne sais pas comment reprendre la course sans me reblesser.' },
      { country: 'FRA', text: 'Entre la rééducation et le retour au club, il n’y a rien. On se débrouille seul.' },
    ],
    solutions: [
      { name: 'Kinésithérapeutes', limit: 'Suivi arrêté à la fin des séances prescrites.' },
      { name: 'Applications d’entraînement', limit: 'Ignorent l’historique de blessure.' },
    ],
  },
  {
    id: 'clubs-enfants', category: 'sport', title: 'Comparer les activités sportives pour enfants',
    summary: 'Voir horaires, tarifs, places restantes et avis des clubs autour de chez soi au même endroit.',
    keywords: ['enfants', 'club', 'activité', 'inscription'],
    criteria: { pain: 54, weakComp: 58, pay: 36, feas: 62 },
    countries: { FRA: [40, 1.3, 0.6], JPN: [22, 1.2, 0] },
    messages: [
      { country: 'FRA', text: 'À la rentrée, j’ai appelé 8 clubs pour connaître les horaires et les places. Il n’existe rien de centralisé.' },
      { country: 'JPN', text: 'Je voudrais comparer les cours de natation selon le trajet depuis l’école.' },
    ],
    solutions: [
      { name: 'Sites des mairies', limit: 'Listes incomplètes, rarement à jour.' },
      { name: 'Forums des associations', limit: 'Un seul jour par an, pas de places en direct.' },
    ],
  },
  // ───────── Culture
  {
    id: 'recommandations-lecture', category: 'culture', title: 'Recevoir des recommandations de lecture personnalisées',
    summary: 'Des suggestions fondées sur ses goûts réels et ses notes, plutôt que sur les meilleures ventes.',
    keywords: ['livres', 'lecture', 'recommandation'],
    criteria: { pain: 34, weakComp: 30, pay: 28, feas: 82 },
    countries: { FRA: [42, 1.0, 0], USA: [70, 0.95, 0], JPN: [30, 1.0, 0] },
    messages: [
      { country: 'FRA', text: 'Les recommandations des libraires en ligne me proposent toujours les mêmes best-sellers.' },
      { country: 'USA', text: 'J’ai noté 300 livres sur une appli et ses suggestions restent à côté de la plaque.' },
    ],
    solutions: [
      { name: 'Réseaux sociaux de lecteurs', limit: 'Recommandations peu personnalisées.' },
      { name: 'Libraires en ligne', limit: 'Mettent en avant les ventes, pas les goûts.' },
    ],
  },
  {
    id: 'sorties-week-end', category: 'culture', title: 'Savoir quoi faire ce week-end autour de soi',
    summary: 'Concerts, expositions et événements locaux filtrés par goûts, budget et distance.',
    keywords: ['sorties', 'événements', 'concert', 'exposition', 'agenda'],
    criteria: { pain: 44, weakComp: 40, pay: 26, feas: 60 },
    countries: { FRA: [52, 1.1, 0], USA: [60, 1.0, 0], BRA: [44, 1.2, 0], JPN: [34, 1.1, 0] },
    messages: [
      { country: 'FRA', text: 'J’apprends toujours le lundi qu’il y avait un super concert gratuit à côté de chez moi samedi.' },
      { country: 'BRA', text: 'L’information est éparpillée entre dix comptes sur les réseaux.' },
    ],
    solutions: [
      { name: 'Agendas culturels municipaux', limit: 'Incomplets, pas de personnalisation.' },
      { name: 'Billetteries en ligne', limit: 'Seulement les événements payants qu’elles vendent.' },
    ],
  },
  {
    id: 'pratiquer-langue-oral', category: 'culture', title: 'Pratiquer une langue à l’oral',
    summary: 'Converser régulièrement avec un partenaire ou un tuteur de son niveau, à des horaires flexibles et à petit prix.',
    keywords: ['langue', 'anglais', 'conversation', 'oral'],
    criteria: { pain: 62, weakComp: 30, pay: 60, feas: 76 },
    countries: { JPN: [80, 1.4, 0], BRA: [66, 1.5, 0], IND: [58, 1.6, 0], FRA: [36, 1.2, 0] },
    messages: [
      { country: 'JPN', text: 'Je comprends l’anglais écrit mais je bloque complètement à l’oral. Les cours sont trop chers pour pratiquer tous les jours.' },
      { country: 'IND', text: 'J’ai un entretien en anglais dans un mois, il me faut de la pratique orale intensive.' },
    ],
    solutions: [
      { name: 'Applications d’apprentissage ludiques', limit: 'Très peu d’oral réel.' },
      { name: 'Tuteurs en ligne', limit: 'Coût élevé pour une pratique quotidienne.' },
    ],
  },
  {
    id: 'archives-familiales', category: 'culture', title: 'Numériser et raconter les archives familiales',
    summary: 'Scanner photos et lettres, identifier les personnes et en faire un récit partageable avec la famille.',
    keywords: ['archives', 'famille', 'généalogie', 'numérisation'],
    criteria: { pain: 40, weakComp: 64, pay: 56, feas: 66 },
    countries: { FRA: [24, 1.3, 0], USA: [36, 1.2, 0], JPN: [14, 1.2, 0] },
    messages: [
      { country: 'FRA', text: 'Ma grand-mère est la seule à savoir qui est sur ces photos. Je voudrais tout enregistrer avant qu’il soit trop tard.' },
      { country: 'USA', text: 'J’ai trois cartons de lettres. Les services de numérisation ne font que des scans.' },
    ],
    solutions: [
      { name: 'Services de numérisation', limit: 'Scans sans contexte ni récit.' },
      { name: 'Sites de généalogie', limit: 'Centrés sur l’arbre, pas sur les souvenirs.' },
    ],
  },
  // ───────── Voyages
  {
    id: 'papiers-visa', category: 'voyages', title: 'Savoir quels papiers sont nécessaires pour un voyage',
    summary: 'Visa, passeport, vaccins, autorisation de sortie : une liste fiable selon la nationalité et la destination.',
    keywords: ['visa', 'passeport', 'formalités', 'voyage'],
    criteria: { pain: 74, weakComp: 42, pay: 46, feas: 60 },
    countries: { IND: [110, 1.6, 0], BRA: [60, 1.4, 0], FRA: [44, 1.2, 0], USA: [50, 1.1, 0] },
    messages: [
      { country: 'IND', text: 'Pour une escale de 6 h, faut-il un visa de transit ? Chaque site dit autre chose.' },
      { country: 'FRA', text: 'J’ai failli rater mon vol parce que l’autorisation électronique n’était pas validée à temps.' },
    ],
    solutions: [
      { name: 'Sites officiels des ambassades', limit: 'Fiables mais dispersés et difficiles à lire.' },
      { name: 'Agences de visa', limit: 'Frais de service élevés.' },
    ],
  },
  {
    id: 'voyage-groupe', category: 'voyages', title: 'Organiser un voyage en groupe',
    summary: 'Choisir les dates, voter pour les options et partager les dépenses dans un seul outil.',
    keywords: ['voyage', 'groupe', 'amis', 'dépenses', 'sondage'],
    criteria: { pain: 58, weakComp: 50, pay: 40, feas: 72 },
    countries: { FRA: [34, 1.4, 0], BRA: [50, 1.6, 0], USA: [46, 1.2, 0], IND: [38, 1.7, 0] },
    messages: [
      { country: 'BRA', text: 'Organiser un voyage à 10 : un sondage ici, un tableur là, une conversation de 2 000 messages…' },
      { country: 'FRA', text: 'Au retour, on passe une semaine à calculer qui doit combien à qui.' },
    ],
    solutions: [
      { name: 'Applications de partage de dépenses', limit: 'Ne gèrent pas l’organisation en amont.' },
      { name: 'Groupes de messagerie', limit: 'Décisions noyées dans les messages.' },
    ],
  },
  {
    id: 'train-multi-pays', category: 'voyages', title: 'Planifier un itinéraire en train multi-pays',
    summary: 'Combiner plusieurs compagnies ferroviaires au meilleur prix, avec les correspondances garanties.',
    keywords: ['train', 'itinéraire', 'europe', 'billets'],
    criteria: { pain: 62, weakComp: 58, pay: 52, feas: 44 },
    countries: { FRA: [52, 1.9, 0], USA: [18, 1.4, 0], JPN: [16, 1.3, 0] },
    messages: [
      { country: 'FRA', text: 'Paris – Vienne en train : trois sites différents, et impossible de savoir si la correspondance est protégée.' },
      { country: 'USA', text: 'Je veux visiter l’Europe en train, mais acheter les billets demande un doctorat.' },
    ],
    solutions: [
      { name: 'Comparateurs de transport', limit: 'Couverture incomplète des compagnies.' },
      { name: 'Pass ferroviaires', limit: 'Réservations obligatoires et suppléments cachés.' },
    ],
  },
  {
    id: 'indemnisation-vol', category: 'voyages', title: 'Se faire indemniser pour un vol retardé',
    summary: 'Vérifier ses droits et déposer une réclamation sans céder une grosse commission.',
    keywords: ['vol', 'retard', 'annulation', 'indemnisation', 'compagnie aérienne'],
    criteria: { pain: 68, weakComp: 24, pay: 54, feas: 70 },
    countries: { FRA: [46, 1.1, 0.4], BRA: [40, 1.2, 0], IND: [36, 1.3, 0] },
    messages: [
      { country: 'FRA', text: '5 h de retard, la compagnie ne répond pas. Les sites spécialisés prennent 35 % de l’indemnité.' },
      { country: 'IND', text: 'Je ne sais même pas si mon vol annulé ouvre droit à quelque chose.' },
    ],
    solutions: [
      { name: 'Sociétés de réclamation', limit: 'Commissions importantes.' },
      { name: 'Formulaires des compagnies', limit: 'Démarches longues, réponses tardives.' },
    ],
  },
  // ───────── Immobilier
  {
    id: 'comparer-devis-travaux', category: 'immobilier', title: 'Comparer des devis de travaux',
    summary: 'Mettre plusieurs devis côte à côte, repérer les postes manquants et savoir si le prix est cohérent.',
    keywords: ['devis', 'travaux', 'artisan', 'rénovation', 'prix'],
    criteria: { pain: 84, weakComp: 70, pay: 68, feas: 70 },
    countries: { FRA: [78, 2.0, 0], USA: [56, 1.5, 0], BRA: [30, 1.6, 0] },
    messages: [
      { country: 'FRA', text: 'Trois devis pour une salle de bain : 9 000, 14 000 et 21 000 €. Les postes ne sont même pas découpés pareil.' },
      { country: 'USA', text: 'Je ne sais pas si l’entrepreneur a oublié l’évacuation des gravats ou s’il la facturera plus tard.' },
      { country: 'BRA', text: 'Il faudrait un outil qui lise les devis et me dise ce qui manque.' },
    ],
    solutions: [
      { name: 'Plateformes de mise en relation avec des artisans', limit: 'Fournissent des devis mais ne les comparent pas.' },
      { name: 'Bases de prix professionnelles', limit: 'Pensées pour les économistes de la construction, illisibles pour un particulier.' },
    ],
  },
  {
    id: 'aides-renovation', category: 'immobilier', title: 'Connaître ses aides à la rénovation énergétique',
    summary: 'Savoir à quelles aides on a droit, les cumuler et monter le dossier dans le bon ordre.',
    keywords: ['aides', 'rénovation', 'énergie', 'isolation', 'subvention'],
    criteria: { pain: 80, weakComp: 46, pay: 60, feas: 54 },
    countries: { FRA: [96, 1.6, 0], USA: [40, 1.3, 0] },
    messages: [
      { country: 'FRA', text: 'J’ai signé le devis avant de demander l’aide… et elle m’a été refusée. Personne ne m’avait prévenu.' },
      { country: 'USA', text: 'Crédits d’impôt fédéraux, aides de l’État, de la commune : impossible de savoir ce qui se cumule.' },
    ],
    solutions: [
      { name: 'Simulateurs publics', limit: 'Estimation sans accompagnement pour le dossier.' },
      { name: 'Accompagnateurs agréés', limit: 'Délais d’attente longs.' },
    ],
  },
  {
    id: 'dossier-location', category: 'immobilier', title: 'Constituer un dossier de location solide',
    summary: 'Rassembler et vérifier ses justificatifs en quelques minutes pour être choisi parmi les candidats.',
    keywords: ['location', 'dossier', 'locataire', 'justificatifs'],
    criteria: { pain: 72, weakComp: 36, pay: 38, feas: 80 },
    countries: { FRA: [70, 1.2, 0.3], USA: [46, 1.1, 0], JPN: [24, 1.2, 0] },
    messages: [
      { country: 'FRA', text: '40 candidats par visite. Si le dossier n’est pas complet dans l’heure, c’est perdu.' },
      { country: 'JPN', text: 'Sans garant local, mon dossier est refusé partout. Quels documents peuvent compenser ?' },
    ],
    solutions: [
      { name: 'Dossiers locataires numériques', limit: 'Ne conseillent pas sur les points faibles.' },
      { name: 'Services de garantie', limit: 'Acceptés de façon inégale par les propriétaires.' },
    ],
  },
  {
    id: 'suivi-copropriete', category: 'immobilier', title: 'Suivre les décisions de sa copropriété',
    summary: 'Comprendre les assemblées générales, suivre les travaux votés et les charges en langage clair.',
    keywords: ['copropriété', 'syndic', 'charges', 'assemblée générale'],
    criteria: { pain: 60, weakComp: 60, pay: 50, feas: 64 },
    countries: { FRA: [44, 1.4, 0], BRA: [28, 1.3, 0] },
    messages: [
      { country: 'FRA', text: 'Le procès-verbal d’AG fait 40 pages. Je veux juste savoir ce qui a été voté et combien je vais payer.' },
      { country: 'BRA', text: 'Le syndic ne répond jamais. Il faudrait un suivi transparent des travaux.' },
    ],
    solutions: [
      { name: 'Extranets de syndics', limit: 'Documents bruts, pas de synthèse.' },
      { name: 'Conseil syndical', limit: 'Bénévoles débordés.' },
    ],
  },
  // ───────── Environnement
  {
    id: 'facture-energie', category: 'environnement', title: 'Comprendre et réduire sa facture d’énergie',
    summary: 'Voir ce qui consomme vraiment dans le logement et recevoir des actions concrètes, chiffrées en euros.',
    keywords: ['énergie', 'électricité', 'chauffage', 'facture', 'consommation'],
    criteria: { pain: 74, weakComp: 40, pay: 52, feas: 70 },
    countries: { FRA: [72, 1.5, 0.3], JPN: [46, 1.4, 0], USA: [58, 1.2, 0], IND: [34, 1.5, 0] },
    messages: [
      { country: 'FRA', text: 'Ma facture a doublé en deux hivers. Je ne sais pas si c’est le chauffe-eau, les radiateurs ou autre chose.' },
      { country: 'JPN', text: 'Le compteur connecté donne des courbes, mais aucun conseil concret.' },
    ],
    solutions: [
      { name: 'Espaces client des fournisseurs', limit: 'Courbes de consommation sans recommandations.' },
      { name: 'Prises connectées', limit: 'Mesurent un seul appareil à la fois.' },
    ],
  },
  {
    id: 'rentabilite-solaire', category: 'environnement', title: 'Savoir si le solaire est rentable chez soi',
    summary: 'Simulation neutre selon le toit, la consommation et les aides, sans être rappelé par des vendeurs.',
    keywords: ['solaire', 'panneaux', 'photovoltaïque', 'rentabilité'],
    criteria: { pain: 58, weakComp: 54, pay: 56, feas: 62 },
    countries: { FRA: [40, 1.8, 0], BRA: [62, 2.1, 0], IND: [56, 2.2, 0], USA: [44, 1.3, 0] },
    messages: [
      { country: 'BRA', text: 'Chaque installateur annonce un délai de rentabilité différent : 4 ans, 9 ans, 12 ans…' },
      { country: 'FRA', text: 'Dès que je remplis un simulateur, cinq commerciaux m’appellent.' },
    ],
    solutions: [
      { name: 'Simulateurs d’installateurs', limit: 'Pas neutres : servent à générer des contacts commerciaux.' },
      { name: 'Cartes solaires publiques', limit: 'Ensoleillement seulement, sans calcul financier.' },
    ],
  },
  {
    id: 'ou-recycler', category: 'environnement', title: 'Savoir où recycler un objet précis',
    summary: 'Photographier un objet et savoir dans quelle poubelle, quel point de collecte ou quelle filière il va.',
    keywords: ['recyclage', 'tri', 'déchets', 'collecte'],
    criteria: { pain: 38, weakComp: 34, pay: 18, feas: 78 },
    countries: { FRA: [40, 1.1, 0], JPN: [50, 1.0, 0], IND: [30, 1.3, 0] },
    messages: [
      { country: 'JPN', text: 'Les règles de tri changent selon l’arrondissement, le calendrier est impossible à retenir.' },
      { country: 'FRA', text: 'Une vieille perceuse, ça va où ? La déchetterie, un magasin, une association ?' },
    ],
    solutions: [
      { name: 'Guides de tri des collectivités', limit: 'Limités à une commune, peu pratiques.' },
      { name: 'Applications de tri', limit: 'Base d’objets incomplète.' },
    ],
  },
  {
    id: 'empreinte-deplacements', category: 'environnement', title: 'Mesurer l’empreinte carbone de ses trajets',
    summary: 'Calculer automatiquement l’impact de ses déplacements quotidiens et comparer des alternatives.',
    keywords: ['carbone', 'trajets', 'mobilité', 'empreinte'],
    criteria: { pain: 30, weakComp: 30, pay: 22, feas: 74 },
    countries: { FRA: [26, 0.9, 0], USA: [20, 0.85, 0], JPN: [14, 0.95, 0] },
    messages: [
      { country: 'FRA', text: 'Mon entreprise demande mon bilan de trajets, je dois tout noter à la main.' },
      { country: 'USA', text: 'J’aimerais comparer voiture et transports en commun pour mon trajet, en temps et en CO₂.' },
    ],
    solutions: [
      { name: 'Calculateurs carbone en ligne', limit: 'Saisie manuelle, ponctuelle.' },
      { name: 'Applications d’itinéraire', limit: 'Indicateur carbone rare et peu visible.' },
    ],
  },
];

// ───────── Génération des volumes (aléatoire déterministe)
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

function series(id, country, [base, growth, spike]) {
  const rnd = mulberry32(hash(`${id}:${country}`));
  const phase = Math.floor(rnd() * 7);
  return Array.from({ length: DAYS }, (_, i) => {
    const t = i / (DAYS - 1);
    const trend = base * Math.pow(growth, t);
    const weekly = 1 + 0.12 * Math.sin((2 * Math.PI * (i + phase)) / 7);
    const noise = 1 + (rnd() - 0.5) * 0.3;
    const daysFromEnd = DAYS - 1 - i;
    const boost = spike && daysFromEnd < 21 ? 1 + spike * Math.sin((Math.PI * (21 - daysFromEnd)) / 42) : 1;
    return Math.max(0, Math.round(trend * weekly * noise * boost));
  });
}

const out = {
  meta: {
    demo: true,
    description: 'Données entièrement fictives, générées pour le prototype Trend Radar.',
    endDate: END_DATE,
    days: DAYS,
    generatedBy: 'scripts/generate-demo-data.mjs',
  },
  countries: [
    { iso: 'FRA', name: 'France' },
    { iso: 'USA', name: 'États-Unis' },
    { iso: 'BRA', name: 'Brésil' },
    { iso: 'IND', name: 'Inde' },
    { iso: 'JPN', name: 'Japon' },
  ],
  needs: NEEDS.map(({ countries, ...n }) => ({
    ...n,
    series: Object.fromEntries(Object.entries(countries).map(([c, p]) => [c, series(n.id, c, p)])),
  })),
};

writeFileSync(new URL('../src/data/demo-needs.json', import.meta.url), JSON.stringify(out));
console.log(`${out.needs.length} besoins fictifs écrits dans src/data/demo-needs.json`);
