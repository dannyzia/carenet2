/**
 * Community Service — blog posts, careers, etc.
 */
import type { BlogPost, CareerData } from "@/backend/models";
import { MOCK_BLOG_POSTS, MOCK_CAREER_DATA } from "@/backend/api/mock";
import { USE_SUPABASE, sbRead, sb } from "./_sb";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

function mapBlogPost(d: any): BlogPost {
  return {
    id: d.id,
    title: d.title,
    excerpt: d.excerpt,
    author: d.author_name,
    date: d.created_at,
    cat: d.category,
    img: d.image || "",
  };
}

export const communityService = {
  async getBlogPosts(): Promise<BlogPost[]> {
    if (USE_SUPABASE) {
      return sbRead("blog:all", async () => {
        const { data, error } = await sb().from("blog_posts")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapBlogPost);
      });
    }
    await delay();
    return MOCK_BLOG_POSTS;
  },

  async getBlogPostById(id: string): Promise<BlogPost | undefined> {
    if (USE_SUPABASE) {
      return sbRead(`blog:${id}`, async () => {
        const { data, error } = await sb().from("blog_posts")
          .select("*")
          .eq("id", id)
          .single();
        if (error) {
          if ((error as any).code === "PGRST116") return undefined;
          throw error;
        }
        return data ? mapBlogPost(data) : undefined;
      });
    }
    await delay();
    return MOCK_BLOG_POSTS.find((p) => p.id === id);
  },

  async getCareerData(): Promise<CareerData> {
    // Career data is typically CMS-managed; no dedicated table yet
    if (USE_SUPABASE) {
      return sbRead("community:careers", async () => {
        return { openings: [], benefits: [], culture: [] };
      });
    }
    await delay();
    return MOCK_CAREER_DATA;
  },
};
