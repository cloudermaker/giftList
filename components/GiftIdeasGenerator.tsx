import { useState } from 'react';
import CustomButton from './atoms/customButton';

export default function GiftIdeasGenerator(): JSX.Element {
    const [giftIdeasInput, setGiftIdeasInput] = useState('');
    const [giftIdeas, setGiftIdeas] = useState<string[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);

    const generateGiftIdeas = () => {
        if (!giftIdeasInput.trim()) return;

        setIsLoadingIdeas(true);

        // Simple keyword-based suggestions (MVP - no API needed)
        const keywords = giftIdeasInput.toLowerCase();
        const suggestions: string[] = [];

        // Categories mapping
        const categories = {
            sport: [
                'Gourde isotherme personnalisée',
                'Montre connectée sportive',
                'Tapis de yoga premium',
                'Accessoires fitness',
                'Abonnement salle de sport',
                'Brassard de course',
                'Corde à sauter intelligente',
                'Foam roller',
                'Électrostimulateur',
                'Balance connectée'
            ],
            yoga: [
                'Tapis de yoga écologique',
                'Blocs de yoga en liège',
                'Coussin de méditation',
                'Livre sur le yoga',
                'Bougie aromathérapie',
                'Sangle de yoga',
                'Tenue de yoga',
                'Bol chantant tibétain',
                'Huiles essentielles',
                'Briques de yoga'
            ],
            cuisine: [
                'Livre de recettes',
                'Robot pâtissier',
                'Coffret épices du monde',
                'Cours de cuisine',
                'Tablier personnalisé',
                'Couteaux de chef',
                'Planche à découper',
                'Batterie de cuisine',
                'Machine à pâtes',
                'Thermomètre de cuisine',
                'Balance de cuisine',
                'Moules à gâteaux'
            ],
            végétarien: [
                'Livre de recettes végétariennes',
                'Spiraliseur à légumes',
                'Kit graines à faire pousser',
                'Coffret thés bio',
                'Extracteur de jus',
                'Cuiseur vapeur',
                'Tofu press',
                'Fermenteur',
                'Germoir à graines'
            ],
            vegan: [
                'Livre de recettes vegan',
                'Substituts fromage',
                'Chocolat vegan premium',
                'Cosmétiques vegan',
                'Chaussures vegan',
                'Sac en matière végétale'
            ],
            lecture: [
                'Liseuse électronique',
                'Abonnement magazine',
                'Lampe de lecture',
                'Marque-page personnalisé',
                'Bon cadeau librairie',
                'Liseuse Kindle',
                'Lampe de chevet design',
                'Support de lecture',
                'Coussin de lecture',
                'Repose-livre',
                'Bibliothèque murale'
            ],
            livre: [
                'Best-seller du moment',
                'Roman policier',
                'Livre de développement personnel',
                'Bande dessinée',
                'Manga',
                'Livre audio',
                'Abonnement Audible'
            ],
            tech: [
                'Écouteurs sans fil',
                'Clavier mécanique',
                'Support pour laptop',
                'Chargeur sans fil',
                'Accessoires gaming',
                'Souris ergonomique',
                'Webcam HD',
                'Micro USB',
                'Hub USB-C',
                'Support téléphone',
                'Batterie externe',
                'Station de charge'
            ],
            gaming: [
                'Manette gaming',
                'Casque gamer RGB',
                'Tapis de souris XXL',
                'Chaise gaming',
                'Lumières LED RGB',
                'Clavier gaming mécanique',
                'Écran gaming 144Hz',
                'Capture card'
            ],
            photo: [
                'Album photo personnalisé',
                'Objectif pour smartphone',
                'Trépied portable',
                'Cours de photographie',
                'Cadre photo numérique',
                'Ring light',
                'Carte mémoire',
                'Sac photo',
                'Filtres objectif',
                'Grip smartphone',
                'Stabilisateur'
            ],
            jardin: [
                'Kit de jardinage',
                'Plantes dépolluantes',
                'Outils de jardinage',
                'Livre sur le jardinage',
                'Composteur',
                'Gants de jardinage',
                'Arrosoir design',
                'Sécateur électrique',
                "Potager d'intérieur",
                'Graines bio',
                'Terreau premium'
            ],
            jardinage: [
                'Serre de jardin',
                'Station météo',
                "Tuyau d'arrosage",
                'Scarificateur',
                'Broyeur de végétaux',
                'Tondeuse robot'
            ],
            voyage: [
                'Valise cabine',
                'Kit de voyage',
                'Guide de voyage',
                'Adaptateur universel',
                'Oreiller de voyage',
                'Pochette passeport',
                'Cadenas TSA',
                'Trousse de toilette',
                'Sac à dos de randonnée',
                'Gourde filtrante',
                'Sac de compression'
            ],
            musique: [
                'Casque audio premium',
                'Vinyles vintage',
                'Enceinte Bluetooth',
                'Cours de musique',
                'Abonnement streaming',
                'Micro karaoké',
                'Platine vinyle',
                'Ampli portable',
                'Câbles audio',
                'Support casque',
                'Enceinte connectée'
            ],
            instrument: [
                'Guitare débutant',
                'Ukulélé',
                'Piano numérique',
                'Harmonica',
                'Djembé',
                'Métronome',
                'Accordeur électronique',
                'Partitions'
            ],
            jeux: [
                'Jeu de société',
                'Puzzle personnalisé',
                'Console de jeu',
                'Jeux vidéo',
                'Accessoires gaming',
                'Jeu de cartes',
                'Escape game maison',
                "Jeu d'échecs",
                'Jeu de dames',
                'Billard',
                'Baby-foot'
            ],
            mode: [
                'Écharpe en cachemire',
                'Montre élégante',
                'Sac à main',
                'Bijoux personnalisés',
                'Parfum',
                'Ceinture cuir',
                'Portefeuille',
                'Lunettes de soleil',
                'Chapeau',
                'Gants cuir',
                'Foulard soie',
                'Pochette de soirée'
            ],
            accessoire: [
                'Cravate',
                'Noeud papillon',
                'Boutons de manchette',
                'Porte-clés design',
                'Parapluie automatique',
                'Étui à lunettes'
            ],
            beauté: [
                'Coffret cosmétiques bio',
                'Soin du visage',
                'Bougie parfumée',
                'Diffuseur huiles essentielles',
                'Set manucure',
                'Brosse nettoyante',
                'Masque LED',
                'Sérum anti-âge',
                'Coffret maquillage',
                'Parfum de niche',
                'Crème de luxe'
            ],
            bienêtre: [
                'Masseur électrique',
                'Couverture lestée',
                'Lampe luminothérapie',
                'Appareil anti-stress',
                "Tapis d'acupression",
                "Fontaine d'intérieur",
                'Sel de bain'
            ],
            enfant: [
                'Jeux éducatifs',
                'Livres jeunesse',
                'Déguisement',
                'Kit créatif',
                'Peluche personnalisée',
                'Trottinette',
                'Vélo enfant',
                'Casque audio enfant',
                'Montre connectée enfant',
                'Globe terrestre',
                'Microscope',
                'Télescope'
            ],
            bébé: [
                'Veilleuse musicale',
                'Doudou personnalisé',
                'Coffret de naissance',
                'Livre en tissu',
                'Mobile musical',
                'Thermomètre bébé',
                'Babyphone vidéo',
                "Tapis d'éveil",
                'Jouets de bain',
                'Coffret empreintes',
                'Couverture personnalisée'
            ],
            maison: [
                'Plaid doux',
                'Coussin décoratif',
                'Cadre photo',
                'Vase design',
                'Lampe décorative',
                'Miroir design',
                'Horloge murale',
                'Tapis berbère',
                "Plantes d'intérieur"
            ],
            déco: [
                'Guirlande lumineuse',
                'Affiche encadrée',
                'Statue décorative',
                'Bougeoir',
                'Plateau décoratif',
                'Objet vintage',
                'Suspension design'
            ],
            vin: [
                'Coffret découverte vins',
                'Carafe à décanter',
                'Tire-bouchon électrique',
                'Cave à vin',
                'Accessoires sommelier',
                "Cours d'oenologie",
                'Livre sur le vin'
            ],
            café: [
                'Machine expresso',
                'Cafetière italienne',
                'Moulin à café',
                'Tasses à café design',
                'Coffret café du monde',
                'Thermos café',
                'Balance pour café'
            ],
            thé: [
                'Théière en fonte',
                'Coffret thés premium',
                'Infuseur à thé',
                'Service à thé japonais',
                'Bouilloire électrique',
                'Tasses à thé'
            ],
            bricolage: [
                'Perceuse visseuse',
                'Boîte à outils complète',
                'Niveau laser',
                'Établi pliable',
                'Kit tournevis',
                'Ponceuse électrique',
                'Scie sauteuse'
            ],
            artiste: [
                'Set aquarelle',
                'Chevalet peinture',
                'Tablette graphique',
                'Carnets de croquis',
                'Coffret crayons',
                'Peinture acrylique',
                'Kit calligraphie'
            ],
            écologie: [
                'Gourde réutilisable',
                'Sacs réutilisables',
                'Bee wrap',
                'Brosse à dents bambou',
                'Shampoing solide',
                'Kit zéro déchet',
                'Composteur intérieur'
            ],
            animaux: [
                'Jouets pour chat',
                'Coussin pour chien',
                'Distributeur croquettes',
                'Fontaine à eau',
                'Arbre à chat',
                'Laisse rétractable',
                'GPS pour animaux'
            ],
            running: [
                'Chaussures de running',
                'Brassard smartphone',
                'Ceinture running',
                'Lampe frontale',
                'Chaussettes compression',
                'Montre GPS'
            ],
            cyclisme: [
                'Casque vélo',
                'Lumières vélo',
                'Compteur GPS',
                'Gants cyclisme',
                'Maillot cycliste',
                'Bidon vélo',
                'Sacoche vélo'
            ],
            pêche: [
                'Canne à pêche',
                'Moulinet',
                'Boîte à leurres',
                'Gilet de pêche',
                'Siège de pêche',
                'Épuisette',
                'Détecteur de touche'
            ],
            camping: [
                'Tente 2 places',
                'Sac de couchage',
                'Matelas gonflable',
                'Lampe camping',
                'Réchaud portable',
                'Glacière',
                'Kit survie'
            ]
        };

        // Match keywords
        for (const [category, items] of Object.entries(categories)) {
            if (keywords.includes(category)) {
                suggestions.push(...items);
            }
        }

        // Age-based suggestions
        if (keywords.match(/\b(60|soixante|retraité|senior)\b/)) {
            suggestions.push(
                'Livre de mémoires',
                'Puzzle 1000 pièces',
                'Abonnement magazine',
                'Coffret dégustation',
                'Cadre photo numérique'
            );
        } else if (keywords.match(/\b(25|vingt|jeune|étudiant)\b/)) {
            suggestions.push(
                'Écouteurs sans fil',
                'Plante dépolluante',
                'Livre inspirant',
                'Bon cadeau expérience',
                'Accessoires tech'
            );
        } else if (keywords.match(/\b(10|enfant|fille|garçon)\b/)) {
            suggestions.push('Jeu de société', 'Livre jeunesse', 'Kit créatif', 'Puzzle', 'Jouet éducatif');
        }

        // Gender keywords (subtle additions)
        if (keywords.match(/\b(père|papa|homme|frère|oncle)\b/)) {
            suggestions.push('Multi-outil', 'Coffret whisky', 'Livre polar', 'Gadget tech', 'Accessoire voiture');
        } else if (keywords.match(/\b(mère|maman|femme|sœur|tante)\b/)) {
            suggestions.push('Bougie parfumée', 'Plaid doux', 'Coffret thé', 'Bijou personnalisé', 'Livre feel-good');
        }

        // Default suggestions if nothing matched
        if (suggestions.length === 0) {
            suggestions.push(
                'Coffret dégustation gourmand',
                'Plante verte dépolluante',
                'Livre best-seller du moment',
                'Bon cadeau expérience',
                'Accessoire de décoration'
            );
        }

        // Deduplicate and limit to 5 suggestions
        const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);

        // Simulate API delay for UX
        setTimeout(() => {
            setGiftIdeas(uniqueSuggestions);
            setIsLoadingIdeas(false);
        }, 800);
    };

    return (
        <section className="home-section">
            <h2 className="font-bold">💡 Besoin d&apos;inspiration ?</h2>
            <p className="text-gray-600 mb-6">
                Décrivez la personne et ses centres d&apos;intérêt, nous vous suggérons des idées de cadeaux !
            </p>

            <div className="max-w-2xl mx-auto">
                <textarea
                    value={giftIdeasInput}
                    onChange={(e) => setGiftIdeasInput(e.target.value)}
                    placeholder="Ex: Pour ma sœur de 25 ans qui adore le yoga et la cuisine végétarienne..."
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vertNoel focus:border-transparent resize-none"
                    rows={3}
                    disabled={isLoadingIdeas}
                />
                <CustomButton
                    variant="green"
                    className="p-3 mt-3 w-full md:w-auto"
                    onClick={generateGiftIdeas}
                    disabled={isLoadingIdeas || !giftIdeasInput.trim()}
                >
                    {isLoadingIdeas ? '⏳ Génération...' : '✨ Trouver des idées'}
                </CustomButton>
            </div>

            {giftIdeas.length > 0 && (
                <div className="mt-8 max-w-4xl mx-auto">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">🎁 Suggestions pour vous :</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {giftIdeas.map((idea, index) => (
                            <div
                                key={index}
                                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🎁</span>
                                    <p className="text-gray-700 font-medium">{idea}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-6">
                        💡 Ajoutez ces idées directement dans votre liste une fois connecté !
                    </p>
                </div>
            )}
        </section>
    );
}
