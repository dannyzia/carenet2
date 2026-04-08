/**
 * Community Service — blog posts, careers, etc.
 */
import type { BlogPost, CareerData } from "@/backend/models";
import { USE_SUPABASE, sbRead, sb } from "./_sb";
import { demoOfflineDelayAndPick } from "./demoOfflineMock";

const EMPTY_CAREER: CareerData = { openings: [], benefits: [], culture: [] };

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
    return demoOfflineDelayAndPick(200, [] as BlogPost[], (m) => m.MOCK_BLOG_POSTS);
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
    return demoOfflineDelayAndPick(200, undefined as BlogPost | undefined, (m) =>
      m.MOCK_BLOG_POSTS.find((p) => p.id === id),
    );
  },

  async getCareerData(): Promise<CareerData> {
    // Career data is typically CMS-managed; no dedicated table yet
    if (USE_SUPABASE) {
      return sbRead("community:careers", async () => {
        return { openings: [], benefits: [], culture: [] };
      });
    }
    return demoOfflineDelayAndPick(200, EMPTY_CAREER, (m) => m.MOCK_CAREER_DATA);
  },
};
