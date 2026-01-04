import { toast } from "sonner";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/webfonts/v1/webfonts';

export interface GoogleFont {
    family: string;
    variants: string[];
    subsets: string[];
    version: string;
    lastModified: string;
    files: Record<string, string>;
    category: string;
    kind: string;
    menu?: string; // URL to subset for preview
}

export interface FontResponse {
    kind: string;
    items: GoogleFont[];
}

let fontCache: GoogleFont[] | null = null;

export const fetchGoogleFonts = async (sort: 'popularity' | 'alpha' | 'date' | 'trending' = 'popularity'): Promise<GoogleFont[]> => {
    if (!API_KEY) {
        console.warn("Google Fonts API Key missing");
        return [];
    }

    if (fontCache && sort === 'popularity') return fontCache;

    try {
        const response = await fetch(`${BASE_URL}?key=${API_KEY}&sort=${sort}`);
        if (!response.ok) throw new Error('Failed to fetch fonts');
        
        const data: FontResponse = await response.json();
        
        if (sort === 'popularity') {
            fontCache = data.items;
        }
        
        return data.items;
    } catch (error) {
        console.error("Error fetching Google Fonts:", error);
        toast.error("Failed to load Google Fonts");
        return [];
    }
};

export const loadFont = async (fontFamily: string, fontObject?: GoogleFont) => {
    if (!fontFamily) return;
    
    // Check if already loaded
    if (document.fonts.check(`12px "${fontFamily}"`)) return;

    // Use FontFace API which is more reliable than appending link tags for canvas interactions
    try {
        let url = '';
        if (fontObject) {
             url = fontObject.menu || fontObject.files?.regular || fontObject.files?.['400'] || Object.values(fontObject.files || {})[0];
        } else {
             // Fallback to constructing generic google fonts URL if we don't have the object (less reliable for variants)
             // We can fetch details or just try the standard API endpoint for CSS
             const familyQuery = fontFamily.replace(/ /g, '+');
             const cssUrl = `https://fonts.googleapis.com/css2?family=${familyQuery}:wght@400;700&display=swap`;
             
             // For CSS URL, we still need to add link tag, but maybe we should fetch the font file URL?
             // Actually, for consistency, let's keep the link tag fallback BUT ensure we wait for it?
             // No, let's prioritize the standard way if no object:
             const linkId = `font-${familyQuery}`;
             if (!document.getElementById(linkId)) {
                const link = document.createElement('link');
                link.id = linkId;
                link.href = cssUrl;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
                // We can't easily await this without polling, but it usually works for DOM. 
                // For Canvas, it might lag.
             }
             return;
        }

        if (url) {
            const secureUrl = url.replace('http:', 'https:');
            const fontFace = new FontFace(fontFamily, `url(${secureUrl})`);
            const loadedFace = await fontFace.load();
            document.fonts.add(loadedFace);
            console.log(`Font ${fontFamily} loaded successfully via FontFace API`);
        }
    } catch (error) {
        console.error(`Failed to load font ${fontFamily}`, error);
    }
};
