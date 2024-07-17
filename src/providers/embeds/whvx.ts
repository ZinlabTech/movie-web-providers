import { EmbedOutput, makeEmbed } from '@/providers/base';
import { baseUrl } from '@/providers/sources/whvx';
import { NotFoundError } from '@/utils/errors';

const providers = [
  {
    id: 'nova',
    rank: 710,
  },
  {
    id: 'astra',
    rank: 700,
  },
];

function embed(provider: { id: string; rank: number }) {
  return makeEmbed({
    id: provider.id,
    name: provider.id.charAt(0).toUpperCase() + provider.id.slice(1),
    rank: provider.rank,
    disabled: false,
    async scrape(ctx) {
      let progress = 50;
      const interval = setInterval(() => {
        if (progress < 100) {
          progress += 1;
          ctx.progress(progress);
        }
      }, 100);

      try {
        const search = await ctx.fetcher.full(
          `${baseUrl}/search?query=${encodeURIComponent(ctx.url)}&provider=${provider.id}`,
        );

        if (search.statusCode === 429) {
          throw new Error('Rate limited');
        } else if (search.statusCode === 404) {
          throw new NotFoundError('No results found');
        } else if (search.statusCode !== 200) {
          throw new NotFoundError('Failed to search');
        }

        const result = await ctx.fetcher(
          `${baseUrl}/source?resourceId=${encodeURIComponent(search.body.url)}&provider=${provider.id}`,
        );

        if (result.statusCode === 429) {
          throw new Error('Rate limited');
        } else if (result.statusCode === 404) {
          throw new NotFoundError('No results found');
        } else if (result.statusCode !== 200) {
          throw new NotFoundError('Failed to search');
        }

        clearInterval(interval);
        ctx.progress(100);

        return result as EmbedOutput;
      } catch (error) {
        clearInterval(interval);
        ctx.progress(100);
        throw new NotFoundError('Failed to search');
      }
    },
  });
}

export const [novaScraper, astraScraper] = providers.map(embed);