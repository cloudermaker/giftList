import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import { GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';

interface ChangelogItem {
    version: string;
    date: string;
    sections: {
        title: string;
        items: string[];
        type: 'added' | 'modified' | 'fixed' | 'security' | 'removed' | 'deprecated';
    }[];
}

interface ChangelogProps {
    versions: ChangelogItem[];
}

const sectionConfig = {
    added: { title: '✨ Nouveautés', color: 'text-green-600' },
    modified: { title: '🔧 Améliorations', color: 'text-blue-600' },
    fixed: { title: '🐛 Corrections', color: 'text-orange-600' },
    security: { title: '🔒 Sécurité', color: 'text-red-600' },
    removed: { title: '🗑️ Suppressions', color: 'text-gray-600' },
    deprecated: { title: '⚠️ Dépréciations', color: 'text-yellow-600' }
};

export default function Changelog({ versions }: ChangelogProps): JSX.Element {
    const pageTitle = 'Historique des versions - Ma Liste de Cadeaux';
    const pageDescription = 'Découvrez les dernières améliorations et nouveautés de Ma Liste de Cadeaux';

    return (
        <Layout withHeader={false}>
            <SEO title={pageTitle} description={pageDescription} canonicalPath="/changelog" />

            <div className="py-8">
                <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Historique des versions</h1>
                <p className="text-center text-gray-600 mb-12">
                    Découvrez les dernières améliorations et nouveautés de Ma Liste de Cadeaux
                </p>

                {versions.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <p>Aucune version disponible pour le moment.</p>
                    </div>
                ) : (
                    versions.map((version, idx) => (
                        <div key={version.version}>
                            <div className="mb-12">
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800">Version {version.version}</h2>
                                    <span className="text-sm text-gray-500">{version.date}</span>
                                </div>

                                <div className="space-y-4">
                                    {version.sections.map((section, sectionIdx) => {
                                        const config = sectionConfig[section.type];
                                        return (
                                            <div key={sectionIdx}>
                                                <h3 className={`text-lg font-semibold ${config.color} mb-2`}>{config.title}</h3>
                                                <ul className="list-disc list-inside space-y-1 text-gray-700">
                                                    {section.items.map((item, itemIdx) => (
                                                        <li key={itemIdx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {idx < versions.length - 1 && <hr className="my-8 border-gray-300" />}
                        </div>
                    ))
                )}
            </div>
        </Layout>
    );
}

export const getStaticProps: GetStaticProps<ChangelogProps> = async () => {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    const changelogContent = fs.readFileSync(changelogPath, 'utf-8');

    const versions: ChangelogItem[] = [];
    const lines = changelogContent.split('\n');

    let currentVersion: ChangelogItem | null = null;
    let currentSection: { title: string; items: string[]; type: any } | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim(); // Trim pour gérer les \r\n Windows

        // Détection d'une nouvelle version
        const versionMatch = line.match(/^## \[([^\]]+)\] - (.+)$/);
        if (versionMatch) {
            if (currentVersion && currentSection) {
                currentVersion.sections.push(currentSection);
            }
            if (currentVersion) {
                versions.push(currentVersion);
            }

            currentVersion = {
                version: versionMatch[1],
                date: versionMatch[2],
                sections: []
            };
            currentSection = null;
            continue;
        }

        // Détection d'une nouvelle section
        const sectionMatch = line.match(/^### (.+)$/);
        if (sectionMatch && currentVersion) {
            if (currentSection) {
                currentVersion.sections.push(currentSection);
            }

            const sectionTitle = sectionMatch[1].trim().toLowerCase();
            let sectionType: 'added' | 'modified' | 'fixed' | 'security' | 'removed' | 'deprecated' = 'added';

            // Support français et anglais
            if (sectionTitle === 'ajouté' || sectionTitle === 'added') {
                sectionType = 'added';
            } else if (sectionTitle === 'modifié' || sectionTitle === 'changed' || sectionTitle === 'modified') {
                sectionType = 'modified';
            } else if (sectionTitle === 'corrigé' || sectionTitle === 'fixed') {
                sectionType = 'fixed';
            } else if (sectionTitle === 'sécurité' || sectionTitle === 'security') {
                sectionType = 'security';
            } else if (sectionTitle === 'supprimé' || sectionTitle === 'removed') {
                sectionType = 'removed';
            } else if (sectionTitle === 'déprécié' || sectionTitle === 'deprecated') {
                sectionType = 'deprecated';
            }

            currentSection = {
                title: sectionMatch[1],
                items: [],
                type: sectionType
            };
            continue;
        }

        // Détection d'un item de liste
        const itemMatch = line.match(/^- (.+)$/);
        if (itemMatch && currentSection) {
            currentSection.items.push(itemMatch[1]);
        }
    }

    // Ajouter la dernière section et version
    if (currentVersion && currentSection) {
        currentVersion.sections.push(currentSection);
    }
    if (currentVersion) {
        versions.push(currentVersion);
    }

    // Limiter aux 5 dernières versions
    const recentVersions = versions.slice(0, 5);

    return {
        props: {
            versions: recentVersions
        }
    };
};
