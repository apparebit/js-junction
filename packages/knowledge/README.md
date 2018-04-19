# @grr/knowledge

> Making the JSON-LD flavor of Schema.org palatable.

The __@grr/knowledge__ package simplifies ingestion and processing of linked
data encoded as [JSON-LD](https://json-ld.org), preferrably using the
[Schema.org](http://schema.org) vocabulary. This package does _not_ provide a
general framework for processing arbitrary linked data. Rather it only
implements targeted APIs for:

 1. Normalizing linked data using a single uniform vocabulary during possibly
    peacemeal ingestion;
 2. Maintaining the resulting index of graph nodes in-memory;
 3. Providing a proxy-based view to transparently skip embedded JSON-LD
    references and metadata, thus letting application focus on data semantics.

To put it differently, __@grr/knowledge__ is targeted at applications, such as
static website generators, that process linked data, such as the metadata for
the website and its pages. The data easily fits into main memory and has a
uniform vocabulary drawing only or mostly from Schema.org. Furthermore, such
applications mix the looking up of properties in mostly tabular data, such as a
particular webpage's title, description, and images, with tracing relations
through the entire corpus, such as authors and publishers for articles appearing
on the website. This package's repository sibling __@grr/apparebit-com__ builds
on [such a site
description](https://github.com/apparebit/js-junction/tree/master/packages/apparebit-com/site.jsonld).

## Savoring JSON-LD in Moderation

The choices of format and ontology are significant. First, JSON-LD provides a
surprisingly straight-forward evolutionary path from ad-hoc encodings of data in
[JSON](http://json.org) to interoperable standards based on an established data
model, the W3C's [Resource Description Framework
(RDF)](https://www.w3.org/TR/rdf11-concepts/). Second, Schema.org was founded by
Google, Microsoft, Yahoo, and Yandex as an open and collaborative effort. The
vocabulary reflects that approach by being both expressive — thanks to many
contributors with different areas of expertise — yet also practical — thanks to
the founding companies' focus on globally scalable services. As such, it is a
welcome departure from earlier, more academic efforts as well as recent attempts
by a single company to impose its own design, notably Facebook's far more
limited and verbose [Open Graph protocol](http://ogp.me).

Having said that, the flexibility of JSON-LD in mapping arbitrary vocabularies
onto varying arrangements of JSON data has a substantial cost of generality. The
combination of core [JSON-LD processing
algorithms](https://json-ld.org/spec/latest/json-ld-api/) and [data
framing](https://json-ld.org/spec/latest/json-ld-framing/) is non-trivial, yet
it is neither necessary nor sufficient for many use cases. To return to the
example of a static website generator, the site description for the website
itself, landing and topic pages, prolific authors, and the publisher probably is
a single document maintained by the webmaster team. Doing so fits nicely into
the remit of a team already concerned with information architecture in general
and optimizing search in particular. At the same time, more specific information
necessarily originates with individual article authors through their articles'
front matter. The website generator combines the different fragments and renders
the site's pages based on that information. It also embeds some of that data in
the pages as metadata for search engines and social networks.

To generalize, there is a class of applications that clearly benefit from having
semantically meaningful data available and, in turn, contribute some of that
data to other applications. But they distinctly do not require the full
flexibility and complexity of JSON-LD or RDF. Rather, a single well-designed
vocabulary and its default encoding as JSON data will do for the vast majority
of use cases. A few applications, however, will require targeted,
domain-specific extensions of that vocabulary. Consequently, a fully featured
implementation of standard algorithms such as Digital Bazaar's
[jsonld.js](https://github.com/digitalbazaar) is overkill and a more targeted
and lightweight library is needed. __@grr/knowledge__ is that library. It works
for applications that meet the following three high-level requirements and
corresponding rules:

  * __All data means what it seems to mean__

      * Data largely uses the Schema.org vocabulary. A document's `@context`
        either references `http://schema.org/` as its external context or
        defines its internal context as being based on that same `@vocab`.
      * If a document uses types, values, or properties not defined by
        Schema.org, it does so by using compact internationalized resource
        identifiers (IRIs) with well-known prefixes, such as `xsd` for
        `http://www.w3.org/2001/XMLSchema#`.
      * Local and custom extensions use a prefix based on the owning
        organization's domain name, e.g., `spectre-evil` for the SPECTRE crime
        syndicate.
      * All data is in compact form, largely using the terms of Schema.org and
        compact IRIs otherwise.

  * __All data is well-structured and correctly labeled__

      * A document contains a single JSON object, which either defines a single
        (root) node or has a `@graph` property defining one or more (root)
        nodes.
      * Root nodes may contain embedded nodes, which in turn may contain
        embedded nodes and so on, thus forming a tree or forest of nodes.
      * A node and its properties are specified through a single JSON object and
        not piecemeal across several such objects. Arbitrary edges, including
        back-edges introducing cycles, are specified through node references
        `{ '@id': … }`.
      * Root nodes must have an `@id`, i.e., must not be blank. Embedded nodes
        may be blank as long as they do not have `@reverse` properties, in which
        case they also must have an `@id`.
      * All identifiers are absolute IRIs. Blank node identifiers, i.e., IRIs
        starting with `_:` are not supported.
      * A document must not contain embedded `@context` or `@graph` definitions.
        For now, it must not use `@index` objects or `@nest` properties either.
      * A document may contain `@list`, `@set`, and `@value` objects. They have
        little impact on this package's functionality, but just like arrays are
        always preserved.

  * __All data fits into memory and is mostly traversed, not queried__

      * This package's main export represents an application's linked data, or
        _knowledge base_. Nodes in the knowledge base may be instantiated
        piecemeal by ingesting several JSON-LD documents. The knowledge base can
        also be written out again as one or several JSON-LD documents. But the
        knowledge base is _not_ a traditional database transparently backed by
        persistent storage and must fit into memory.
      * Nodes in the knowledge base may reference nodes that are not part of
        that knowledge base. Following the principle of "primum non nocere"
        (first, do no harm) for linked data, this package preserves that
        information. But it does _not_ automatically resolve such references and
        ingest the linked data. The direct benefit of this restriction is a
        simpler, synchronous API — in fact, the graph view described below has
        no API, relying on proxied getters instead.
      * Every knowledge base has a primary index mapping `@id` values to nodes.
        It also supports some measure of secondary indices to speed up common
        access patterns, such as looking up the descriptions of all web pages,
        that is, all nodes having a `@type` of `WebPage`. At the same time, this
        package does _not_ include a query language and is best suited to
        applications that perform relatively simple lookups.

In summary, __@grr/knowledge__ is designed for use cases that (1) employ
well-known vocabularies, foremost Schema.org, (2) the data is curated and
originates from an authoritative source, and (3) the processing requirements are
modest, with the working set fitting into memory and predominantly consisting of
lookups.

During ingestion, this package validates a JSON-LD document's data and
normalizes the data by:

  * lifting embedded non-blank nodes to the root,
  * replacing `@value` objects without `@type` and without `@language` with the
    plain and equivalent values,
  * replacing `@set` objects with more basic and equivalent arrays,
  * augmenting `@reverse` properties by adding the corresponding forward
    properties,
  * augmenting inverse properties in the Schema.org vocabulary with the opposite
    properties.

Of course, properties are only augmented if both nodes are part of the same
knowledge base.

Applications access the nodes in the knowledge base through several methods
covering both lookups and updates. To further optimize the primary use case of
graph traversal, this package also provides an alternative view onto the data,
the so-called _graph view_. It is implemented through JavaScript proxies, whose
read traps automatically resolve `@id` references to the full nodes (if part of
the knowledge base) and skip `@list` and `@value` objects for their values. For
completeness, `@set` objects are also skipped for their values. Though they
should not be present in the knowledge base, as they are desugared during
ingestion. This works because the elision of embedded JSON-LD metadata is
resolved by the same underlying primitive in JavaScript, i.e., reading a
property. Adding or modifying property values, however, does not have such a
clean match to JavaScript primitives and, as a result, is currently disabled
for the graph view.

--------------------------------------------------------------------------------

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
