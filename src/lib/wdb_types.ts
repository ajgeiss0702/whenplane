export type WanDb_FloatplaneData = {
	live?: boolean;
	isWAN?: boolean;
	isAfterparty?: boolean;
	title?: string;
	description?: string;
	thumbnail?: string;
	error?: any;
	imminence?: number;
	textImminence?: string;
};

export type WanDb_SocketState = {
	lastReceive: number;
};

export type WanDb_Episode = {
	id: string;
	floatplane: string;
	title: string;
	description: string;
	thumbnail: string;
	aired: string;
	duration: number;
	topicCount: number;
	hostCount: number;
	sponsorCount: number;
	merchMessageCount: number;
	introStart: number | null;
	introDuration: number | null;
	preShowOffset: number;
	errors: string[];
	cast: unknown[];
	products: unknown[];
	merchMessages: unknown[];
	topics: WanDb_Topic[];
	sponsors: WanDb_Sponsor[];
};

export type WanDb_Topic = {
	id: string;
	episodeId: string;
	title: string;
	parent: string | null;
	start: number;
	end: number;
	created: string;
	ref: unknown | null;
	kind: string;
	modified: string;
	children?: WanDb_Topic[];
};

export type WanDb_Sponsor = {
	id: string;
	message: string;
	url: string | null;
	added: string;
	modified: string;
	companyId: string;
	isDennis: boolean;
	start: number;
	end: number;
	safe: boolean;
	episodeId: string;
	isSponsorDebut: boolean;
	company: {
		id: string;
		name: string;
		links: unknown[];
		logo: unknown | null;
		founded: unknown | null;
		added: string;
		modified: string;
	};
};
