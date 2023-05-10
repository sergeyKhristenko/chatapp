FROM denoland/deno:alpine-1.33.2

WORKDIR /app

# Prefer not to run as root.
USER deno

# # Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# # Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
COPY backend/deps.ts ./deps.ts
RUN deno cache deps.ts

# These steps will be re-run upon each file change in your working directory:
ADD ./backend .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache server.ts

EXPOSE 3000

CMD ["task", "prod", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--allow-run"]
